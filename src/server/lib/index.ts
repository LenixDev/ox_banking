import { ClassInterface, OxAccount } from './class';
import { CreateNewAccount } from './account';
import { GetCharIdFromStateId, SelectDefaultAccountId } from './db';

class AccountInterface {
  constructor(public accountId: number) {}
}

const CreateAccountInstance = (account?: OxAccount) => {
  if (!account) return;

  return new AccountInterface(account.accountId) as OxAccount;
}

//   setShared: () => {},
//   accountId: 0
export const CreateAccount = async (owner: number | string, label: string) => {
  const accountId = await CreateNewAccount(owner, label);
  const account =  await OxAccount.get(accountId);
  return CreateAccountInstance(account)
}

export const GetAccount = (accountId: number) => {
  return {
    get: () => {},
    playerHasPermission: () => {},
    deleteAccount: () => {},
    depositMoney: () => {},
    withdrawMoney: () => {},
    transferBalance: () => {},
    getCharacterRole: () => {},
    setCharacterRole: () => {},
    setShared: () => {},
    accountId: 0,
  }
}

// accountId: 0
export async function GetCharacterAccount(id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  const accountId = charId && (await SelectDefaultAccountId('owner', charId));
  return accountId ? OxAccount.get(accountId) : null;
}

export const GetPlayer = (id: string | number) => {
  return ClassInterface.get(id)
}