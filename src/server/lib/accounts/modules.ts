import { OxAccountRole, OxAccountPermissions, GetGroup } from "@communityox/ox_core";
import { OxPlayer } from "../player/class";
import { GetConnection, SelectAccount } from "../database/modules";
import { getRandomInt } from "@communityox/ox_lib";
import { accountRoles } from "./init";
import { Connection } from "../database/class";

const doesAccountExist = 'SELECT 1 FROM accounts WHERE id = ?';
const blacklistedGroupActions = {
  addUser: true,
  removeUser: true,
  manageUser: true,
  transferOwnership: true,
  manageAccount: true,
  closeAccount: true,
} as Record<keyof OxAccountPermissions, true>;

export { CanPerformAction, CreateNewAccount }

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

const CanPerformAction = async (
  player: OxPlayer,
  accountId: number,
  role: OxAccountRole | null,
  action: keyof OxAccountPermissions,
) => {
  const CheckRolePermission = (roleName: OxAccountRole | null, permission: keyof OxAccountPermissions) => {
    if (!roleName) return;

    return accountRoles?.[roleName.toLowerCase()]?.[permission];
  }

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

const CreateNewAccount = async (owner: string | number, label: string, isDefault?: boolean) => {
  const conn = await GetConnection();

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