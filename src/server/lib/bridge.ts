import { QBXGangs, QBXJobs } from "./types"

const GetJobs = (): Promise<QBXJobs> => exports.qbx_core.GetJobs()
const GetGangs = (): Promise<QBXGangs> => exports.qbx_core.GetGangs()

const Bridge = { GetJobs, GetGangs }

export default Bridge