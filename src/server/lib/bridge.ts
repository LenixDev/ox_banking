import { QboxGangs, QboxGroups, QboxJobs } from "./types"

const GetJobs = (): Promise<QboxJobs> => exports.qbx_core.GetJobs()
const GetGangs = (): Promise<QboxGangs> => exports.qbx_core.GetGangs()
const GetGroups = async (): Promise<QboxGroups> => ({ ...await GetJobs(), ...await GetGangs() })

const Bridge = { GetGroups }
export default Bridge