import { Dict } from "@communityox/ox_core";
import { OxPlayer } from "./player/class";
import { OxAccount } from "./accounts/class";
import { QBoxPlayer } from "./types";

const ON_PLAYER_LOADED = 'QBCore:Server:OnPlayerLoaded';

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

    onNet(ON_PLAYER_LOADED, async () => {
      const src = source
      const { PlayerData: {
        cid, citizenid
      } }: QBoxPlayer = await exports.qbx_core.GetPlayer(src)
      OxPlayer.add(src, new OxPlayer(src, cid, citizenid));
    });

    DEV: console.info(`Instantiated ClassInterface<${this.name}>`);

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