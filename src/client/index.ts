import { Config, LoadJsonFile, Locale } from '@common/.';
import { OxAccountPermissions, OxAccountRole } from '@communityox/ox_core';
import lib, { cache, getLocales, hideTextUI, notify, requestAnimDict, sleep, triggerServerCallback, waitFor } from '@communityox/ox_lib/client';
import type { Character } from '../common/typings';
import { SendTypedNUIMessage, serverNuiCallback } from './utils';

const enableInvoicingByCommand = true
let hasLoadedUi = false;
let isUiOpen = false;
let isATMopen = false;

function canOpenUi(): boolean {
  return IsPedOnFoot(cache.ped) && !IsPedDeadOrDying(cache.ped, true);
}

function setupUi() {
  if (hasLoadedUi) return;

  const accountRoles: OxAccountRole[] = GlobalState.accountRoles;
  const permissions = accountRoles.reduce(
    (acc, role) => {
      acc[role] = GlobalState[`accountRole.${role}`] as OxAccountPermissions;
      return acc;
    },
    {} as Record<OxAccountRole, OxAccountPermissions>
  );

  SendNUIMessage({
    action: 'setInitData',
    data: {
      locales: getLocales(),
      permissions,
    },
  });

  hasLoadedUi = true;
}

const openAtm = async ({ entity }: { entity: number }) => {
  if (!canOpenUi) return;

  const atmEnter = await requestAnimDict('mini@atmenter');

  // The ATM location can sometimes be invalid (0.0,0.0,0.0)
  const [cX, cY, cZ] = GetEntityCoords(entity, false);
  const [pX, pY, pZ] = GetEntityCoords(cache.ped, false);

  const doAnim = (entity && DoesEntityExist(entity) && Math.abs((cX - cY) + (cZ - pX) + (pY - pZ)) < 5.0)

  if (doAnim)
  {
    const [x, y, z] = GetOffsetFromEntityInWorldCoords(entity, 0, -0.7, 1);
    const heading = GetEntityHeading(entity);
    const sequence = OpenSequenceTask(0) as unknown as number;

    TaskGoStraightToCoord(0, x, y, z, 1.0, 5000, heading, 0.25);
    TaskPlayAnim(0, atmEnter, 'enter', 4.0, -2.0, 1600, 0, 0.0, false, false, false);
    CloseSequenceTask(sequence);
    TaskPerformSequence(cache.ped, sequence);
    ClearSequenceTask(sequence);
  }
  setupUi();

  await sleep(0);
  await waitFor(() => GetSequenceProgress(cache.ped) === -1 || undefined, '', false);

  PlaySoundFrontend(-1, 'PIN_BUTTON', 'ATM_SOUNDS', true);

  isUiOpen = true;
  isATMopen = true;

  SendTypedNUIMessage('openATM', null);
  SetNuiFocus(true, true);
  RemoveAnimDict(atmEnter);
};

exports('openAtm', openAtm);

const openBank = () => {
  if (!canOpenUi) return;

  setupUi();

  const playerCash: number = exports.ox_inventory.GetItemCount('money');
  isUiOpen = true;

  hideTextUI();

  SendTypedNUIMessage<Character>('openBank', { cash: playerCash });
  SetNuiFocus(true, true);
};

exports('openBank', openBank);
AddTextEntry('ox_banking_bank', Locale('bank'));

const createBankBlip = ([x, y, z]: number[]) => {
  const { sprite, colour, scale } = Config.BankBlip;

  if (!sprite) return;

  const blip = AddBlipForCoord(x, y, z);
  SetBlipSprite(blip, sprite);
  SetBlipColour(blip, colour);
  SetBlipScale(blip, scale);
  SetBlipAsShortRange(blip, true);
  BeginTextCommandSetBlipName('ox_banking_bank');
  EndTextCommandSetBlipName(blip);
};

const banks = LoadJsonFile<typeof import('~/data/banks.json')>('data/banks.json');

if (Config.UseOxTarget) {
  const atms = LoadJsonFile<typeof import('~/data/atms.json')>('data/atms.json').map((value) => GetHashKey(value));

  const atmOptions = {
    name: 'access_atm',
    icon: 'fa-solid fa-money-check',
    label: Locale('target_access_atm'),
    export: 'openAtm',
    distance: 1.3,
  };

  const bankOptions = {
    name: 'access_bank',
    icon: 'fa-solid fa-dollar-sign',
    label: Locale('target_access_bank'),
    export: 'openBank',
    distance: 1.3,
  };

  exports.ox_target.addModel(atms, atmOptions);

  banks.forEach((bank) => {
    exports.ox_target.addBoxZone({
      coords: bank.coords,
      size: bank.size,
      rotation: bank.rotation,
      drawSprite: true,
      options: bankOptions,
    });

    createBankBlip(bank.coords);
  });
} else banks.forEach(({ coords }) => createBankBlip(coords));

if (enableInvoicingByCommand) {
  onNet('ox_banking/client/createInvoice', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const input = await lib.inputDialog(Locale('create_invoice'), [
      { type: 'number', label: Locale('account_number'), required: true },
      { type: 'number', label: Locale('amount'), required: true },
      { type: 'textarea', label: Locale('message') },
      { 
        type: 'date', 
        label: Locale('invoice_pick_due_date'), 
        required: true, 
        min: tomorrow.toLocaleDateString()
      },
    ], {})
    if (!input) return
    const { success, message } = await triggerServerCallback<{ success: boolean, message: string }>('ox_banking/server/createInvoice', 5000, {
      toAccount: input[0],
      amount: input[1],
      message: input[2],
      dueDate: Math.floor(Number(input[3]) / 1000),
    }) as { success: boolean, message: string };
    if (!success) notify({
      title: message,
      type: 'error'
    })
  })
}

RegisterNuiCallback('exit', async (_: any, cb: Function) => {
  cb(1);
  SetNuiFocus(false, false);

  isUiOpen = false;
  isATMopen = false;
});

on('ox_inventory:itemCount', (itemName: string, count: number) => {
  if (!isUiOpen || isATMopen || itemName !== 'money') return;

  SendTypedNUIMessage<Character>('refreshCharacter', { cash: count });
});

serverNuiCallback('getDashboardData');
serverNuiCallback('transferOwnership');
serverNuiCallback('manageUser');
serverNuiCallback('removeUser');
serverNuiCallback('getAccountUsers');
serverNuiCallback('addUserToAccount');
serverNuiCallback('getAccounts');
serverNuiCallback('createAccount');
serverNuiCallback('deleteAccount');
serverNuiCallback('depositMoney');
serverNuiCallback('withdrawMoney');
serverNuiCallback('transferMoney');
serverNuiCallback('renameAccount');
serverNuiCallback('convertAccountToShared');
serverNuiCallback('getLogs');
serverNuiCallback('getInvoices');
serverNuiCallback('payInvoice');
