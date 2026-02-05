import { QBXGangs, QBXJobs } from "./types"

const GetJobs = async (): Promise<QBXJobs> => await exports.qbx_core.GetJobs()
const GetGangs = async (): Promise<QBXGangs> => await exports.qbx_core.GetGangs()

const Bridge = { GetJobs, GetGangs }

export default Bridge