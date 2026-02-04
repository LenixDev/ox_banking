import { OxAccount, OxPlayer } from './class';
import { CreateNewAccount } from './account';
import { GetCharIdFromStateId, SelectDefaultAccountId } from './db';
import { OxAccountMetadata, OxAccountPermissions, OxAccountRole } from '@communityox/ox_core';
import { TransferAccountBalance } from './types';
import { oxmysql } from '@communityox/oxmysql';

class AccountInterface {
  constructor(public accountId: number) {}
}

const CreateAccountInstance = (account?: OxAccount) => {
  if (!account) return;

  return new AccountInterface(account.accountId) as OxAccount;
}

export const CreateAccount = async (owner: number | string, label: string) => {
  const accountId = await CreateNewAccount(owner, label);
  const account = await OxAccount.get(accountId);
  return CreateAccountInstance(account)
}

export const GetAccount = async (accountId: number) => {
  const Ox = await OxAccount.get(accountId);
  function get<T extends keyof OxAccountMetadata>(key: T): Promise<OxAccountMetadata[T]>;
  function get<T extends keyof OxAccountMetadata>(keys: T[]): Promise<Pick<OxAccountMetadata, T>>;
  function get<T extends keyof OxAccountMetadata>(keys: T | T[]) {
    if (Array.isArray(keys)) {
      return Ox.get(keys) as Promise<Pick<OxAccountMetadata, T>>;
    }
    return Ox.get(keys) as Promise<OxAccountMetadata[T]>;
  }
  return {
    get,
    playerHasPermission: (playerId: number, permission: keyof OxAccountPermissions) => Ox.playerHasPermission(playerId, permission),
    deleteAccount: () => Ox.deleteAccount(),
    depositMoney: (playerId: number, amount: number, message?: string, note?: string) => Ox.depositMoney(playerId, amount, message, note),
    withdrawMoney: (playerId: number, amount: number, message?: string, note?: string) => Ox.withdrawMoney(playerId, amount, message, note),
    transferBalance: ({
      toId,
      amount,
      overdraw,
      message,
      note,
      actorId
    }: TransferAccountBalance) => Ox.transferBalance({toId, amount, overdraw, message, note, actorId}),
    getCharacterRole: (playerId: number | string) => Ox.getCharacterRole(playerId),
    setCharacterRole: (playerId: number | string, role: OxAccountRole) => Ox.setCharacterRole(playerId, role),
    setShared: () => Ox.setShared(),
    accountId: Ox.accountId
  }
}

export async function GetCharacterAccount(id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  const accountId = charId && (await SelectDefaultAccountId('owner', charId));
  return accountId ? OxAccount.get(accountId) : null;
}

class PlayerInterface {
  public state: StateBagInterface;

  constructor(
    public source: number,
    public userId: number,
    public charId: number | undefined,
    public stateId: string | undefined,
    public username: string,
    public identifier: string,
    public ped: number,
  ) {
    this.source = source;
    this.userId = userId;
    this.charId = charId;
    this.stateId = stateId;
    this.username = username;
    this.identifier = identifier;
    this.ped = ped;
  }

  getCoords() {
    return GetEntityCoords(this.ped);
  }

  getState() {
    return Player(source).state;
  }

  async getAccount() {
    return this.charId ? GetCharacterAccount(this.charId) : null;
  }
}

function CreatePlayerInstance(player?: OxPlayer) {
  if (!player) return;

  return new PlayerInterface(
    player.source as number,
    player.userId,
    player.charId,
    player.stateId,
    player.username,
    player.identifier,
    player.ped,
  ) as OxPlayer & PlayerInterface;
}

export const GetPlayer = (id: string | number) => CreatePlayerInstance(OxPlayer.get(id))

setImmediate(async () => {

  await oxmysql.query(`
    CREATE TABLE IF NOT EXISTS account_roles (
      id INT(11) NOT NULL AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL DEFAULT '',
      deposit TINYINT(1) NOT NULL DEFAULT '0',
      withdraw TINYINT(1) NOT NULL DEFAULT '0',
      addUser TINYINT(1) NOT NULL DEFAULT '0',
      removeUser TINYINT(1) NOT NULL DEFAULT '0',
      manageUser TINYINT(1) NOT NULL DEFAULT '0',
      transferOwnership TINYINT(1) NOT NULL DEFAULT '0',
      viewHistory TINYINT(1) NOT NULL DEFAULT '0',
      manageAccount TINYINT(1) NOT NULL DEFAULT '0',
      closeAccount TINYINT(1) NOT NULL DEFAULT '0',
      sendInvoice TINYINT(1) NOT NULL DEFAULT '0',
      payInvoice TINYINT(1) NOT NULL DEFAULT '0',
      PRIMARY KEY (id),
      UNIQUE INDEX name (name)
    )
  `);
    
  await oxmysql.query(`
    INSERT INTO account_roles (id, name, deposit, withdraw, addUser, removeUser, manageUser, transferOwnership, viewHistory, manageAccount, closeAccount, sendInvoice, payInvoice) VALUES
      (1, 'viewer', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
      (2, 'contributor', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
      (3, 'manager', 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1),
      (4, 'owner', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    ON DUPLICATE KEY UPDATE id=id
  `);
})