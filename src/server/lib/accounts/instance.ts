import { OxAccount } from "./class";

export const CreateAccountInstance = (account?: OxAccount) => {
  if (!account) return;

  return new AccountInterface(account.accountId) as OxAccount;
}
