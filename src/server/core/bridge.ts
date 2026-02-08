/**
 * @copyright Adapted by Lenix <https://github.com/lenixdev> - Original: ox_core by CommunityOx
*/

import { QboxGangs, QboxGroups, QboxJobs } from "./types"

const GetJobs = (): Promise<QboxJobs> => exports.qbx_core.GetJobs()
const GetGangs = (): Promise<QboxGangs> => exports.qbx_core.GetGangs()
const GetGroups = async (): Promise<QboxGroups> => ({ ...await GetJobs(), ...await GetGangs() })

export default GetGroups