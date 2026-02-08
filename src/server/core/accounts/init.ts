import { OxAccountPermissions, OxAccountRole } from "@communityox/ox_core"
import { db } from "../database/modules"
import { OxAccountMetadataRow } from "../types"

const accountRoles = {} as Record<string, OxAccountPermissions>

async function LoadRoles() {
  const roles = await db.execute<OxAccountMetadataRow>('SELECT * FROM account_roles')

  if (!roles[0]) return

  roles.forEach((role) => {
    const roleName = (role.name as string).toLowerCase() as OxAccountRole
    delete role.name
    delete role.id

    accountRoles[roleName] = role
    GlobalState[`accountRole.${roleName}`] = role
  })

  GlobalState['accountRoles'] = Object.keys(accountRoles)
}

export { accountRoles }

setImmediate(LoadRoles)