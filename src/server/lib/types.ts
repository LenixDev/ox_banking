import { Dict, OxAccountPermissions, OxAccountRole } from "@communityox/ox_core"

type GroupName = string
type JobName = GroupName
type GangName = GroupName
interface GroupGradeData {
  name: string
  isboss: boolean
  bankAuth: boolean
}

interface GroupStandards<GradeData> {
  label: string
  grades: Record<number, GradeData>
}
interface JobGradeData extends GroupGradeData {
  payment: number
}
interface GangGradeData extends GroupGradeData {}


interface JobData extends GroupStandards<JobGradeData> {
  type?: string
  defaultDuty: boolean
  offDutyPay: boolean
}
interface GangData extends GroupStandards<GangGradeData> {}

export type QBXJobs = Record<JobName, JobData>
export type QBXGangs = Record<GangName, GangData>
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