import { GetGroup, OxAccountPermissions, OxAccountRole } from "@communityox/ox_core";
import { Connection, db, GetConnection, SelectAccount } from "./db";
import { getRandomInt } from '@communityox/ox_lib';
import locales from "./common";
import { OxPlayer } from "./class";
import { OxAccountMetadataRow } from "./types";

const doesAccountExist = 'SELECT 1 FROM accounts WHERE id = ?';
const addBalance = 'UPDATE accounts SET balance = balance + ? WHERE id = ?';
const getBalance = 'SELECT balance FROM accounts WHERE id = ?';
const removeBalance = 'UPDATE accounts SET balance = balance - ? WHERE id = ?';
const safeRemoveBalance = `${removeBalance} AND (balance - ?) >= 0`;
const addTransaction = 'INSERT INTO accounts_transactions (actorId, fromId, toId, amount, message, note, fromBalance, toBalance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
const selectAccountRole = 'SELECT role FROM accounts_access WHERE accountId = ? AND charId = ?';

const GenerateAccountId = async (conn: Connection) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const baseId = Number(year + month) * 1e3;

  while (true) {
    const accountId = getRandomInt(10, 99) * 1e7 + baseId + getRandomInt(0, 9999);
    const existingId = await conn.scalar<number>(doesAccountExist, [accountId]);

    if (!existingId) return accountId;
  }
}

export const CreateNewAccount = async (owner: string | number, label: string, isDefault?: boolean) => {
  using conn = await GetConnection();

  const accountId = await GenerateAccountId(conn);
  const column = typeof owner === 'string' ? 'group' : 'owner';
  const result = await conn.update(
    `INSERT INTO accounts (id, label, \`${column}\`, type, isDefault) VALUES (?, ?, ?, ?, ?)`,
    [accountId, label, owner, column === 'group' ? 'group' : 'personal', isDefault || 0],
  );

  if (result && column === 'owner')
    conn.execute('INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?)', [accountId, owner, 'owner']);

  return accountId;
}

export async function PerformTransaction(
  fromId: number,
  toId: number,
  amount: number,
  overdraw: boolean,
  message?: string,
  note?: string,
  actorId?: number,
): Promise<{ success: boolean; message?: string }> {
  amount = Number.parseInt(String(amount));

  if (isNaN(amount)) return { success: false, message: 'amount_not_number' };

  if (amount <= 0) return { success: false, message: 'invalid_amount' };

  using conn = await GetConnection();

  const fromBalance = await conn.scalar<number>(getBalance, [fromId]);
  const toBalance = await conn.scalar<number>(getBalance, [toId]);

  if (fromBalance === null || toBalance === null) return { success: false, message: 'no_balance' };

  await conn.beginTransaction();

  try {
    const query = overdraw ? removeBalance : safeRemoveBalance;
    const values = [amount, fromId];

    if (!overdraw) values.push(amount);

    const removedBalance = await conn.update(query, values);
    const addedBalance = removedBalance && (await conn.update(addBalance, [amount, toId]));

    if (addedBalance) {
      await conn.execute(addTransaction, [
        actorId,
        fromId,
        toId,
        amount,
        message ?? locales('transfer'),
        note,
        fromBalance - amount,
        toBalance + amount,
      ]);

      emit('ox:transferredMoney', { fromId, toId, amount });

      return { success: true };
    }
  } catch (e) {
    console.error(`Failed to transfer $${amount} from account<${fromId}> to account<${toId}>`);
    console.log(e);
  }

  conn.rollback();

  return { success: false, message: 'something_went_wrong' };
}

export async function WithdrawMoney(
  playerId: number,
  accountId: number,
  amount: number,
  message?: string,
  note?: string,
): Promise<{ success: boolean; message?: string }> {
  amount = Number.parseInt(String(amount));

  if (isNaN(amount)) return { success: false, message: 'amount_not_number' };

  if (amount <= 0) return { success: false, message: 'invalid_amount' };

  const player = OxPlayer.get(playerId);

  if (!player?.charId) return { success: false, message: 'no_charId' };

  using conn = await GetConnection();
  const role = await conn.scalar<OxAccountRole>(selectAccountRole, [accountId, player.charId]);

  if (!(await CanPerformAction(player, accountId, role, 'withdraw'))) return { success: false, message: 'no_access' };

  const balance = await conn.scalar<number>(getBalance, [accountId]);

  if (balance === null) return { success: false, message: 'no_balance' };

  await conn.beginTransaction();

  const affectedRows = await conn.update(safeRemoveBalance, [amount, accountId, amount]);

  if (!affectedRows || !exports.ox_inventory.AddItem(playerId, 'money', amount)) {
    conn.rollback();
    return {
      success: false,
      message: 'something_went_wrong',
    };
  }

  await conn.execute(addTransaction, [
    player.charId,
    accountId,
    null,
    amount,
    message ?? locales('withdraw'),
    note,
    balance - amount,
    null,
  ]);

  emit('ox:withdrewMoney', { playerId, accountId, amount });

  return { success: true };
}

export async function DepositMoney(
  playerId: number,
  accountId: number,
  amount: number,
  message?: string,
  note?: string,
): Promise<{ success: boolean; message?: string }> {
  amount = Number.parseInt(String(amount));

  if (isNaN(amount)) return { success: false, message: 'amount_not_number' };

  if (amount <= 0) return { success: false, message: 'invalid_amount' };

  const player = OxPlayer.get(playerId);

  if (!player?.charId)
    return {
      success: false,
      message: 'no_charid',
    };

  const money = exports.ox_inventory.GetItemCount(playerId, 'money');

  if (amount > money) return { success: false, message: 'insufficient_funds' };

  using conn = await GetConnection();
  const balance = await conn.scalar<number>(getBalance, [accountId]);

  if (balance === null) return { success: false, message: 'no_balance' };

  const role = await conn.scalar<OxAccountRole>(selectAccountRole, [accountId, player.charId]);

  if (!(await CanPerformAction(player, accountId, role, 'deposit'))) return { success: false, message: 'no_access' };

  await conn.beginTransaction();

  const affectedRows = await conn.update(addBalance, [amount, accountId]);

  if (!affectedRows || !exports.ox_inventory.RemoveItem(playerId, 'money', amount)) {
    conn.rollback();
    return {
      success: false,
      message: 'something_went_wrong',
    };
  }

  await conn.execute(addTransaction, [
    player.charId,
    null,
    accountId,
    amount,
    message ?? locales('deposit'),
    note,
    null,
    balance + amount,
  ]);

  emit('ox:depositedMoney', { playerId, accountId, amount });

  return {
    success: true,
  };
}

export async function DeleteAccount(accountId: number): Promise<{ success: boolean; message?: string }> {
  const success = await db.update(`UPDATE accounts SET \`type\` = 'inactive' WHERE id = ?`, [accountId]);

  if (!success)
    return {
      success: false,
      message: 'something_went_wrong',
    };

  return { success: true };
}

const accountRoles = {} as Record<string, OxAccountPermissions>;
const blacklistedGroupActions = {
  addUser: true,
  removeUser: true,
  manageUser: true,
  transferOwnership: true,
  manageAccount: true,
  closeAccount: true,
} as Record<keyof OxAccountPermissions, true>;
function CheckRolePermission(roleName: OxAccountRole | null, permission: keyof OxAccountPermissions) {
  if (!roleName) return;

  return accountRoles?.[roleName.toLowerCase()]?.[permission];
}

export async function CanPerformAction(
  player: OxPlayer,
  accountId: number,
  role: OxAccountRole | null,
  action: keyof OxAccountPermissions,
) {
  if (CheckRolePermission(role, action)) return true;

  const groupName = (await SelectAccount(accountId))?.group;

  if (groupName) {
    if (action in blacklistedGroupActions) return false;

    const group = GetGroup(groupName);
    const groupRole = group.accountRoles[player.getGroup(groupName)];

    if (CheckRolePermission(groupRole, action)) return true;
  }

  return false;
}

async function LoadRoles() {
  const roles = await db.execute<OxAccountMetadataRow>('SELECT * FROM account_roles');

  if (!roles[0]) return;

  roles.forEach((role) => {
    const roleName = (role.name as string).toLowerCase() as OxAccountRole;
    delete role.name;
    delete role.id;

    accountRoles[roleName] = role;
    GlobalState[`accountRole.${roleName}`] = role;
  });

  GlobalState['accountRoles'] = Object.keys(accountRoles);
}

setImmediate(LoadRoles);
