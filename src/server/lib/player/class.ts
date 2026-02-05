import { Dict } from "@communityox/ox_core";
import { ClassInterface } from "../classInterface";
import { GetCharacterAccount } from "..";
import { UpdateInvoice } from "../accounts/actions";

export class OxPlayer extends ClassInterface {
  source: number | string;
  charId?: number;
  stateId?: string;
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

  constructor(source: number, charId?: number, stateId?: string) {
    super();
    this.source = source;
    this.#groups = {};
    this.charId = charId;
    this.stateId = stateId;
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
    return await UpdateInvoice(invoiceId, this.charId);
  }

  /** Get an instance of OxPlayer with the matching charId. */
  static getFromCharId(id: number) {
    return this.keys.charId[id];
  }
}

export class PlayerInterface {
  constructor(
    public source: number,
    public charId: number | undefined,
    public stateId: string | undefined,
  ) {
    this.source = source;
    this.charId = charId;
    this.stateId = stateId;
  }

  async getAccount() {
    return this.charId ? GetCharacterAccount(this.charId) : null;
  }
}