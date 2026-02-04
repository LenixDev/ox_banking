import { Dict, OxAccountMetadata, OxAccountPermissions, OxAccountRole } from '@communityox/ox_core';
import {
  GetCharIdFromStateId,
  SelectAccount,
  SelectAccountRole,
  SetAccountType,
  UpdateAccountAccess,
} from './db'
import { CanPerformAction, DeleteAccount, DepositMoney, PayAccountInvoice, PerformTransaction, WithdrawMoney } from './account';
import { TransferAccountBalance } from './types';

export class ClassInterface {
  protected static members: Dict<any>;
  protected static keys?: Dict<Dict<any>>;
  protected static callableMethods: Dict<true>;

  /** Exports several class methods and makes non-private methods callable from external resources. */
  static init() {
    const classMethods = Object.getOwnPropertyNames(this.prototype);

    if (classMethods) {
      this.callableMethods = {};

      classMethods.forEach((method) => {
        if (method !== 'constructor') this.callableMethods[method] = true;
      });
    }

    onNet('QBCore:Server:OnPlayerLoaded', async () => {
      const src = source
      const { PlayerData: { cid } }: {
        PlayerData: {
          cid: number
        }
      } = await exports.qbx_core.GetPlayer(src)
      const player = new OxPlayer(src, cid)
      this.members[src] = player;
    });

    const name = this.name;
    DEV: console.info(`Instantiated ClassInterface<${name}>`);

    return this;
  }

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

export class OxPlayer extends ClassInterface {
  source: number | string;
  userId: number;
  charId?: number;
  stateId?: string;
  username: string;
  identifier: string;
  ped: number;
  #groups: Dict<number>;

  protected static members: Dict<OxPlayer> = {};
  protected static keys: Dict<Dict<OxPlayer>> = {
    userId: {},
    charId: {},
  };

  /** Get an instance of OxPlayer with the matching playerId. */
  static get(id: string | number) {
    return this.members[id];
  }

  constructor(source: number, charId?: number) {
    super();
    this.source = source;
    this.#groups = {};
    this.charId = charId;

  }

  /** Returns the current grade of a given group name, or the first matched name and grade in the filter. */
  getGroup(filter: string): number;
  getGroup(filter: string[] | Record<string, number>): [string, number] | [];
  getGroup(filter: string | string[] | Record<string, number>) {
    if (typeof filter === 'string') {
      return this.#groups[filter];
    }

    if (Array.isArray(filter)) {
      for (const name of filter) {
        const grade = this.#groups[name];
        if (grade) return [name, grade];
      }
    } else if (typeof filter === 'object') {
      for (const [name, requiredGrade] of Object.entries(filter)) {
        const grade = this.#groups[name];
        if (grade && (requiredGrade as number) <= grade) {
          return [name, grade];
        }
      }
    }
  }

  async payInvoice(invoiceId: number) {
    if (!this.charId) return;
    return await PayAccountInvoice(invoiceId, this.charId);
  }

  /** Get an instance of OxPlayer with the matching charId. */
  static getFromCharId(id: number) {
    return this.keys.charId[id];
  }
}

OxPlayer.init();

export class OxAccount extends ClassInterface {
  protected static members: Dict<OxAccount> = {};
  
  static async get(accountId: number) {
    if (accountId in this.members) this.members[accountId];
    
    const validAccount = await SelectAccount(accountId);
    
    if (!validAccount) throw new Error(`No account exists with accountId ${accountId}.`);

    return new OxAccount(accountId);
  }

  /**
   * Get the value of specific key(s) from account metadata.
   */
  async get<T extends keyof OxAccountMetadata>(key: T): Promise<OxAccountMetadata[T]>;
  async get<T extends keyof OxAccountMetadata>(keys: T[]): Promise<Pick<OxAccountMetadata, T>>;
  async get<T extends keyof OxAccountMetadata>(
    keys: T | T[],
  ): Promise<OxAccountMetadata[T] | Pick<OxAccountMetadata, T> | null> {
    const metadata = await SelectAccount(this.accountId);

    if (!metadata) return null;

    if (Array.isArray(keys))
      return keys.reduce(
        (acc, key) => {
          acc[key] = metadata[key];
          return acc;
        },
        {} as Pick<OxAccountMetadata, T>,
      );

    return metadata[keys];
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

  /**
   * Set the account access role of a character by charId or stateId.
   */
  async setCharacterRole(id: number | string, role?: OxAccountRole) {
    const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
    return charId && UpdateAccountAccess(this.accountId, charId, role);
  }

  /**
   * Transfer funds to another account.
   */
  async transferBalance({ toId, amount, overdraw = false, message, note, actorId }: TransferAccountBalance) {
    return PerformTransaction(this.accountId, toId, amount, overdraw, message, note, actorId);
  }

  /**
   * Deposit money into the account.
   */
  async depositMoney(playerId: number, amount: number, message?: string, note?: string) {
    return DepositMoney(playerId, this.accountId, amount, message, note);
  }

  /**
   * Withdraw money from the account.
   */
  async withdrawMoney(playerId: number, amount: number, message?: string, note?: string) {
    return WithdrawMoney(playerId, this.accountId, amount, message, note);
  }

  /**
   * Mark the account as deleted. It can no longer be accessed, but remains in the database.
   */
  async deleteAccount() {
    return DeleteAccount(this.accountId);
  }

  /**
   * Checks if a player's active character has permission to perform an action on the account.
   */
  async playerHasPermission(playerId: number, permission: keyof OxAccountPermissions) {
    const player = OxPlayer.get(playerId);

    if (!player?.charId) return false;

    const role = await this.getCharacterRole(player.charId);
    return await CanPerformAction(player, this.accountId, role, permission);
  }
}

OxAccount.init();