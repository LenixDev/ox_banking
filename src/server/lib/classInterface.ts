import { Dict } from "@communityox/ox_core";
import { OxPlayer } from "./player/class";
import { OxAccount } from "./accounts/class";

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

OxAccount.init();
OxPlayer.init();