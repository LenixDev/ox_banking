import { Dict } from '@communityox/ox_core';
import { GetCharIdFromStateId, SelectAccount, SelectAccountRole, SetAccountType } from './db'

export class ClassInterface {
  protected static members: Dict<any>;
  protected static keys?: Dict<Dict<any>>;
  protected static callableMethods: Dict<true>;

  /** Adds a new member of the class to its registries. */
  static add(id: string | number, member: any) {
    if (this.members[id]) return false;

    this.members[id] = member;

    if (this.keys) {
      Object.entries(this.keys).forEach(([key, obj]) => {
        if (member[key]) {
          obj[member[key]] = member;
        }
      });
    }

    return true;
  }
  /** Get a member of the class by its id. */
  static get(id: string | number) {
    return this.members[id];
  }
}

export class OxAccount extends ClassInterface {
  protected static members: Dict<OxAccount> = {};

  static async get(accountId: number) {
    if (accountId in this.members) this.members[accountId];

    const validAccount = await SelectAccount(accountId);

    if (!validAccount) throw new Error(`No account exists with accountId ${accountId}.`);

    return new OxAccount(accountId);
  }

  constructor(public accountId: number) {
    super();
    OxAccount.add(accountId, this);
  }

  async setShared() {
    return SetAccountType(this.accountId, 'shared');
  }

  /**
   * Get the account access role of a character by charId or stateId.
   */
  async getCharacterRole(id: number | string) {
    const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
    return charId ? SelectAccountRole(this.accountId, charId) : null;
  }
}