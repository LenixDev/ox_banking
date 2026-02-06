import { Dict, OxAccountMetadata, OxAccountRole, OxAccountPermissions } from "@communityox/ox_core"
import { SelectAccount, SetAccountType, GetCharIdFromStateId, SelectAccountRole, UpdateAccountAccess } from "../database/modules"
import { TransferAccountBalance } from "../types"
import { ClassInterface } from "../classInterface"
import { OxPlayer } from "../player/class"
import { PerformTransaction, DepositMoney, WithdrawMoney, DeleteAccount } from "./actions"
import { CanPerformAction } from "./modules"

export { OxAccount, AccountInterface }

class OxAccount extends ClassInterface {
  protected static members: Dict<OxAccount> = {}
  
  static async get(accountId: number) {
    if (accountId in this.members) this.members[accountId]
    
    const validAccount = await SelectAccount(accountId)
    
    if (!validAccount) throw new Error(`No account exists with accountId ${accountId}.`)

    return new OxAccount(accountId)
  }

  /**
   * Get the value of specific key(s) from account metadata.
   */
  async get<T extends keyof OxAccountMetadata>(key: T): Promise<OxAccountMetadata[T]>
  async get<T extends keyof OxAccountMetadata>(keys: T[]): Promise<Pick<OxAccountMetadata, T>>
  async get<T extends keyof OxAccountMetadata>(
    keys: T | T[],
  ): Promise<OxAccountMetadata[T] | Pick<OxAccountMetadata, T> | null> {
    console.warn(keys)
    const metadata = await SelectAccount(this.accountId)

    if (!metadata) return null

    if (Array.isArray(keys))
      return keys.reduce(
        (acc, key) => {
          acc[key] = metadata[key]
          return acc
        },
        {} as Pick<OxAccountMetadata, T>,
      )

    return metadata[keys]
  }

  constructor(public accountId: number) {
    super()
    OxAccount.add(accountId, this)
  }

  async setShared() {
    return SetAccountType(this.accountId, 'shared')
  }

  /**
   * Get the account access role of a character by charId or stateId.
   */
  async getCharacterRole(id: number | string) {
    const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id
    return charId ? SelectAccountRole(this.accountId, charId) : null
  }

  /**
   * Set the account access role of a character by charId or stateId.
   */
  async setCharacterRole(id: number | string, role?: OxAccountRole) {
    const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id
    return charId && UpdateAccountAccess(this.accountId, charId, role)
  }

  /**
   * Transfer funds to another account.
   */
  async transferBalance({ toId, amount, overdraw = false, message, note, actorId }: TransferAccountBalance) {
    return PerformTransaction(this.accountId, toId, amount, overdraw, message, note, actorId)
  }

  /**
   * Deposit money into the account.
   */
  async depositMoney(playerId: number, amount: number, message?: string, note?: string) {
    return DepositMoney(playerId, this.accountId, amount, message, note)
  }

  /**
   * Withdraw money from the account.
   */
  async withdrawMoney(playerId: number, amount: number, message?: string, note?: string) {
    return WithdrawMoney(playerId, this.accountId, amount, message, note)
  }

  /**
   * Mark the account as deleted. It can no longer be accessed, but remains in the database.
   */
  async deleteAccount() {
    return DeleteAccount(this.accountId)
  }

  /**
   * Checks if a player's active character has permission to perform an action on the account.
   */
  async playerHasPermission(playerId: number, permission: keyof OxAccountPermissions) {
    const player = OxPlayer.get(playerId)

    if (!player?.charId) return false

    const role = await this.getCharacterRole(player.charId)
    return await CanPerformAction(player, this.accountId, role, permission)
  }
}

class AccountInterface {
  constructor(public accountId: number) {}
}