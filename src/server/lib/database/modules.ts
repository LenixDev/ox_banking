import { pool } from './pool'
import { waitFor } from '@communityox/ox_lib'
import { OkPacket } from '../types'
import type { QueryOptions } from 'mariadb'
import { OxAccountMetadata, OxAccountUserMetadata } from '@communityox/ox_core'
import { Connection } from './class'

const selectAccountRole = 'SELECT role FROM accounts_access WHERE accountId = ? AND charId = ?'

const SelectAccounts = async (column: 'owner' | 'group' | 'id', id: number | string) => {
  return db.execute<OxAccountMetadata>(`SELECT * FROM accounts WHERE \`${column}\` = ?`, [id])
}

const db = {
  async execute<T>(query: string | QueryOptions, values?: any[]) {
    using conn = await GetConnection()
    return conn.execute<T extends OkPacket ? OkPacket : T[]>(query, values)
  },
  async column<T>(query: string | QueryOptions, values?: any[]) {
    return db.scalar(await db.execute<T[]>(query, values)) as T | null
  },
  async update(query: string | QueryOptions, values?: any[]) {
    return (await db.execute<OkPacket>(query, values))?.affectedRows
  },
  async row<T>(query: string | QueryOptions, values?: any[]) {
    return db.single(await db.execute<T[]>(query, values)) as T | null
  },
  scalar<T>(resp: T[] | null) {
    if (resp && resp[0]) for (const key in resp[0]) return resp[0][key] as T
    return null
  },
  single<T>(resp: T[] | null) {
    return resp ? resp[0] : null
  },
}

const getScalar = <T>(resp: T[] | null) => {
  if (resp && resp[0]) for (const key in resp[0]) return resp[0][key] as T
  return null
}

const GetConnection = async () => {
  while (!pool) {
    await waitFor(() => pool, 'Failed to acquire database connection.', 30000)
  }

  return new Connection(await pool.getConnection())
}

const SelectAccount = async (id: number) => {
  const result = db.single(await SelectAccounts('id', id))
  console.log(result)
  return result
}

const SetAccountType = async(accountId: number, type: string): Promise<{ success: boolean, message?: string }> => {
  const success = await db.update('UPDATE `accounts` SET `type` = ? WHERE `id` = ?', [type, accountId])

  if (!success) return { success: false, message: 'update_account_error' }

  return { success: true }
}

const GetCharIdFromStateId = async (stateId: string) => {
  return db.column<number>('SELECT id FROM players WHERE citizenid = ?', [stateId])
}

const SelectDefaultAccountId = async (column: 'owner' | 'group' | 'id', id: number | string) => {
  return await db.column<number>(`SELECT id FROM accounts WHERE \`${column}\` = ? AND isDefault = 1`, [id])
}

const SelectAccountRole = async (accountId: number, charId: number) => {
  return db.column<OxAccountUserMetadata['role']>(selectAccountRole, [accountId, charId])
}

const UpdateAccountAccess = async (
  accountId: number,
  id: number,
  role?: string,
): Promise<{ success: boolean, message?: string }> => {
  if (!role) {
    const success = await db.update('DELETE FROM accounts_access WHERE accountId = ? AND charId = ?', [accountId, id])

    if (!success) return { success: false, message: 'something_went_wrong' }

    return { success: true }
  }

  const success = await db.update(
    'INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
    [accountId, id, role],
  )

  if (!success) return { success: false, message: 'something_went_wrong' }

  return { success: true }
}

export { 
  db,
  getScalar,
  GetConnection,
  SelectAccount,
  SetAccountType,
  GetCharIdFromStateId,
  SelectDefaultAccountId,
  SelectAccountRole,
  UpdateAccountAccess
}