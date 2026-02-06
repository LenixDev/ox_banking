import { Dict } from "@communityox/ox_core"
import { QBoxPlayer } from "./types"
import { CreateNewAccount } from "./accounts/modules"
import { fatal } from "@trippler/tr_lib/shared"

const ON_PLAYER_LOADED = 'QBCore:Server:OnPlayerLoaded'

class ClassInterface {
  protected static members: Dict<any>
  protected static keys?: Dict<Dict<any>>
  protected static callableMethods: Dict<true>

  /** Exports several class methods and makes non-private methods callable from external resources. */
  static init() {
    const classMethods = Object.getOwnPropertyNames(this.prototype)

    if (classMethods) {
      this.callableMethods = {}

      classMethods.forEach((method) => {
        if (method !== 'constructor') this.callableMethods[method] = true
      })
    }

    if (this.name === 'OxPlayer') {
      onNet(ON_PLAYER_LOADED, async () => {
        const src = source
        const { PlayerData: {
          cid, citizenid
        } }: QBoxPlayer = await exports.qbx_core.GetPlayer(src)

        // Dynamic import to avoid circular dependency
        const { OxPlayer } = await import('./player/class')
        const { GetPlayer } = await import('./index')
        
        OxPlayer.add(src, new OxPlayer(src, cid, citizenid))
        
        const player = GetPlayer(src);
        if (!player?.charId) return;
        
        const account = await player.getAccount();

        if (!account) {
          await CreateNewAccount(player.charId, 'Personal', true);
          const createdAccount = await player.getAccount();
          if (!createdAccount) fatal(`Failed to create account for player ${player.charId}.`)
        }
      })
    }

    DEV: console.info(`Instantiated ClassInterface<${this.name}>`)

    return this
  }

  /** Adds a new member of the class to its registries. */
  static add(id: string | number, member: any) {
    if (this.members[id]) return false

    this.members[id] = member

    if (this.keys) {
      Object.entries(this.keys).forEach(([key, obj]) => {
        if (member[key]) {
          obj[member[key]] = member
        }
      })
    }

    return true
  }
  /** Get a member of the class by its id. */
  static get(id: string | number) {
    return this.members[id]
  }
}

export { ClassInterface }