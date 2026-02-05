import { GetCharIdFromStateId, SelectDefaultAccountId } from './database/modules';
import { OxAccountMetadata, OxAccountPermissions, OxAccountRole } from '@communityox/ox_core';
import { TransferAccountBalance } from './types';
import { CreateNewAccount } from './accounts/modules';
import { OxAccount } from './accounts/class';
import { OxPlayer } from './player/class';
import { CreateAccountInstance } from './accounts/instance';
import { CreatePlayerInstance } from './player/instance';
import './database/init'

// TODO: test when no account found (not created with char creation)
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

export const GetPlayer = (id: string | number) => CreatePlayerInstance(OxPlayer.get(id))
    
//accounts
// CONSTRAINT accounts_group_fk
//         FOREIGN KEY (\`group\`) REFERENCES ox_groups (name)
//           ON UPDATE SET NULL ON DELETE SET NULL,
//       CONSTRAINT accounts_owner_fk
//         FOREIGN KEY (owner) REFERENCES characters (charId)
//           ON UPDATE SET NULL ON DELETE SET NULL