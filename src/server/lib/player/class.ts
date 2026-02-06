import { Dict } from "@communityox/ox_core";
import { ClassInterface } from "../classInterface";
import { GetCharacterAccount } from "..";
import { UpdateInvoice } from "../accounts/actions";

export { OxPlayer, PlayerInterface }

class OxPlayer extends ClassInterface {
  source: number | string;
  charId?: number;
  stateId?: string;
  #groups: Dict<number>;

  protected static members: Dict<OxPlayer> = {};
  protected static keys: Dict<Dict<OxPlayer>> = {
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
  getGroup(filter: string): number {
    if (typeof filter === 'string') {
      return this.#groups[filter];
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
class PlayerInterface {
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