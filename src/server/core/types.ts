/**
 * @copyright Adapted by Lenix <https://github.com/lenixdev> - Original: ox_core by CommunityOx
*/

import { Dict, OxAccountPermissions, OxAccountRole } from "@communityox/ox_core"

interface GroupGradeData {
  name: string
  isboss: boolean
  bankAuth: boolean
  accountRole?: OxAccountRole
}

interface GroupStandards<GradeData> {
  label: string
  grades: Record<number, GradeData>
}

interface JobData extends GroupStandards<GroupGradeData & { payment: number }> {
  type?: string
  defaultDuty: boolean
  offDutyPay: boolean
}
interface GangData extends GroupStandards<GroupGradeData> {}
export type QboxJobs = Record<string, JobData>
export type QboxGangs = Record<string, GangData>
export type QboxGroups = Record<string, GroupStandards<GroupGradeData>>

export interface QBoxPlayer {
  PlayerData: {
    cid: number
    citizenid: string
  }
}
export type OxAccountMetadataRow = OxAccountPermissions & { id?: number, name?: OxAccountRole }

export interface TransferAccountBalance {
  toId: number
  amount: number
  overdraw?: boolean
  message?: string
  note?: string
  actorId?: number
}

export interface MySqlRow<T = string | number | boolean | Dict<any> | undefined> {
  [column: string]: T
}

export interface OkPacket {
  affectedRows: number
  insertId: number
  warningStatus: any
}