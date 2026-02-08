/**
 * @copyright Adapted by Lenix <https://github.com/lenixdev> - Original: ox_core by CommunityOx
*/

import { OxCreateInvoice } from '@communityox/ox_core'
import { GetPlayer } from '.'
import { OxAccount } from './accounts/class'
import { OxPlayer } from './player/class'
import { addCommand, onClientCallback } from '@communityox/ox_lib/server'

OxAccount.init()
OxPlayer.init()

addCommand('createinvoice',
  async (source) => emitNet('ox_banking/client/createInvoice', source),
  { help: 'Creates a new invoice for a specific account.' }
)

onClientCallback('ox_banking/server/createInvoice', async (source, {
  toAccount, amount, message, dueDate
}: OxCreateInvoice & { message: OxCreateInvoice["message"] | undefined }) => {
  const { charId: actorId, getAccount } = GetPlayer(source)
  const oxAccount = await getAccount()
  return await oxAccount.createInvoice({
    actorId, toAccount, amount, message, dueDate
  })
})