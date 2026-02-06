import { GetCharIdFromStateId, SelectDefaultAccountId } from './database/modules';
import { OxAccountMetadata, OxAccountPermissions, OxAccountRole } from '@communityox/ox_core';
import { TransferAccountBalance } from './types';
import { CreateNewAccount } from './accounts/modules';
import { AccountInterface, OxAccount } from './accounts/class';
import { OxPlayer, PlayerInterface } from './player/class';
import './database/init'
import './accounts/init'

// TODO: test when no account found (not created with char creation)
export const CreateAccount = async (owner: number | string, label: string) => {
  const accountId = await CreateNewAccount(owner, label);
  const account = await OxAccount.get(accountId);
  if (!account) return;
  return new AccountInterface(account.accountId) as OxAccount;
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

export const GetPlayer = (id: string | number) => {
  const player = OxPlayer.get(id)
  
  if (!player) return;

  const { source, charId, stateId } = player;
  return new PlayerInterface(
    source as number,
    charId,
    stateId,
  ) as OxPlayer & PlayerInterface;
}