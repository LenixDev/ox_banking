import type { OxAccountRole, OxAccountUserMetadata } from '@communityox/ox_core';
import { CreateAccount, GetAccount, GetCharacterAccount, GetPlayer } from './core';
import { onClientCallback, versionCheck, checkDependency } from '@communityox/ox_lib/server';
import { oxmysql } from '@communityox/oxmysql';
import type { DateRange } from 'react-day-picker';
import type {
  AccessTableData,
  AccessTableUser,
  Account,
  DashboardData,
  Invoice,
  InvoicesFilters,
  LogsFilters,
  RawLogItem,
  Transaction,
} from '../common/typings';
import Bridge from './core/bridge';
import { info } from '@trippler/tr_lib/shared';

versionCheck('communityox/ox_banking');

const coreDepCheck: true | [false, string] = checkDependency('ox_core', '1.1.0');
const accountRolesFallback: OxAccountRole[] = ['manager', 'viewer'] as const

if (coreDepCheck !== true) {
  setInterval(() => {
    // TODO
    // console.error(coreDepCheck[1]);
  }, 1000);
}

onClientCallback('ox_banking:getAccounts', async (playerId): Promise<Account[]> => {
  const player = GetPlayer(playerId);
  if (!player.charId) return;
  
  try {
    const groups = await Bridge.GetGroups()    
    const accessAccounts = await oxmysql.rawExecute<Array<OxAccountUserMetadata & { grade: number, group: string }>>(
      `
      SELECT DISTINCT
        access.role,
        account.*,
        NULLIF(TRIM(CONCAT(
          IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
          ' ', 
          IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
        )), '') AS ownerName,
        pg.grade,
        pg.group
      FROM accounts account
      LEFT JOIN players p ON account.owner = p.id
      LEFT JOIN player_groups pg
        ON pg.citizenid = ?
        AND pg.group = account.group
      LEFT JOIN accounts_access access
        ON account.id = access.accountId
        AND access.charId = ?
      WHERE account.type != 'inactive'
        AND (
          access.charId = ?
          OR (
            account.group IS NOT NULL
            AND pg.grade IS NOT NULL
          )
        )
      GROUP BY account.id
      ORDER BY
        account.owner = ? DESC,
        account.isDefault DESC
      `,
      [player.stateId, player.charId, player.charId, player.charId]
    );
    
    // process roles and ownerNames
    accessAccounts.forEach(account => {
      const { role, group: accountGroup, grade, ownerName } = account;
      // determine role
      if (!role && accountGroup && grade !== null) {
        const groupGrade = groups?.[accountGroup]?.grades?.[grade];
        if (groupGrade) account.role = groupGrade.accountRole || (groupGrade.isboss ? accountRolesFallback[0] : accountRolesFallback[1]);
      }
      
      // set ownerName for groups
      if (!ownerName && accountGroup && groups?.[accountGroup]) account.ownerName = accountGroup;
    });

    // filter out invalid group accounts (matches old gg.accountRole IS NOT NULL logic)
    const validAccounts = accessAccounts.filter(({ group, role }) => {
      if (group && !role) return false; // group exists but no valid role
      return true;
    });
    
    const accounts: Account[] = validAccounts.map((account) => ({
      group: account.group,
      id: account.id,
      label: account.label,
      isDefault: player.charId === account.owner ? account.isDefault : false,
      balance: account.balance,
      type: account.type,
      owner: account.ownerName,
      role: account.role,
    }));
    
    return accounts;
  } catch (errorOccured) { 
    throw new Error(errorOccured);
  }
});

onClientCallback('ox_banking:createAccount', async (playerId, { name, shared }: { name: string; shared: boolean }) => {
  const { charId } = GetPlayer(playerId);

  if (!charId) return;

  const account = await CreateAccount(charId, name);

  if (shared) await account.setShared();

  return account.accountId;
});

onClientCallback('ox_banking:deleteAccount', async (playerId, accountId: number) => {
  const account = await GetAccount(accountId);
  const balance = await account?.get('balance');

  if (balance !== 0) return;

  const hasPermission = await account.playerHasPermission(playerId, 'closeAccount');

  if (!hasPermission) return;

  return await account.deleteAccount();
});

interface UpdateBalance {
  accountId: number;
  amount: number;
}

interface TransferBalance {
  fromAccountId: number;
  target: string | number;
  transferType: 'account' | 'person';
  amount: number;
}

onClientCallback('ox_banking:depositMoney', async (playerId, { accountId, amount }: UpdateBalance) => {
  const account = await GetAccount(accountId);
  return await account.depositMoney(playerId, amount);
});

onClientCallback('ox_banking:withdrawMoney', async (playerId, { accountId, amount }: UpdateBalance) => {
  const account = await GetAccount(accountId);
  return await account.withdrawMoney(playerId, amount);
});

onClientCallback(
  'ox_banking:transferMoney',
  async (playerId, { fromAccountId, target, transferType, amount }: TransferBalance) => {
    const account = await GetAccount(fromAccountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'withdraw');

    if (!hasPermission) return;

    target = typeof(target) == "string" ? Number.parseInt(target) : target
    let targetAccountId = 0;

    try {
      targetAccountId =
        transferType === 'account'
          ? (await GetAccount(target as number))?.accountId
          : (await GetCharacterAccount(target))?.accountId;
    } catch (e) {
      return {
        success: false,
        message: 'account_id_not_exists',
      };
    }

    if (transferType === 'person' && !targetAccountId)
      return {
        success: false,
        message: 'state_id_not_exists',
      };

    if (!targetAccountId)
      return {
        success: false,
        message: 'account_id_not_exists',
      };

    if (account.accountId === targetAccountId)
      return {
        success: false,
        message: 'same_account_transfer',
      };

    const player = GetPlayer(playerId);
    return await account.transferBalance({
      toId: targetAccountId,
      amount: amount,
      actorId: player.charId,
    });
  }
);

onClientCallback('ox_banking:getDashboardData', async (playerId): Promise<DashboardData> => {
  const account = await GetPlayer(playerId)?.getAccount();

  if (!account) return;

  try {
    const groups = await Bridge.GetGroups()
    const overview = await oxmysql.rawExecute<
      {
        day: string;
        income: number;
        expenses: number;
      }[]
    >(
      `
      SELECT
        LOWER(DAYNAME(d.date)) as day,
        CAST(COALESCE(SUM(CASE WHEN at.toId = ? THEN at.amount ELSE 0 END), 0) AS UNSIGNED) as income,
        CAST(COALESCE(SUM(CASE WHEN at.fromId = ? THEN at.amount ELSE 0 END), 0) AS UNSIGNED) as expenses
      FROM (
        SELECT CURDATE() as date
        UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 2 DAY)
        UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 4 DAY)
        UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 5 DAY)
        UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        ) d
      LEFT JOIN accounts_transactions at ON d.date = DATE(at.date) AND (at.toId = ? OR at.fromId = ?)
      GROUP BY d.date
      ORDER BY d.date ASC
      `,
      [account.accountId, account.accountId, account.accountId, account.accountId]
    );
    const transactions = await oxmysql.rawExecute<Transaction[]>(
      `
      SELECT id, amount, UNIX_TIMESTAMP(date) as date, toId, fromId, message,
      CASE
      WHEN toId = ? THEN 'inbound'
      ELSE 'outbound'
      END AS 'type'
      FROM accounts_transactions
      WHERE toId = ? OR fromId = ?
      ORDER BY id DESC
      LIMIT 5
      `,
      [account.accountId, account.accountId, account.accountId]
    );

    const invoices = await oxmysql.rawExecute<Array<Omit<Invoice, 'label'> & { label: string, fullName: string, owner: string, group: string }>>(
      `
      SELECT ai.id, ai.amount, UNIX_TIMESTAMP(ai.dueDate) as dueDate, UNIX_TIMESTAMP(ai.paidAt) as paidAt, a.label, 
      NULLIF(TRIM(CONCAT(
        IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.firstname')), ''), 
        ' ', 
        IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.lastname')), '')
      )), '') as fullName,
      a.owner, a.group,
      CASE
          WHEN ai.payerId IS NOT NULL THEN 'paid'
          WHEN NOW() > ai.dueDate THEN 'overdue'
          ELSE 'unpaid'
      END AS status
      FROM accounts_invoices ai
      LEFT JOIN accounts a ON a.id = ai.fromAccount
      LEFT JOIN players po ON (a.owner IS NOT NULL AND po.id = a.owner)
      WHERE ai.toAccount = ?
      ORDER BY ai.id DESC
      LIMIT 5
      `,
      [account.accountId]
    );
    // does the [ CONCAT(a.label, ' - ', IFNULL(co.fullName, g.label)) AS label ]'s job
    invoices.forEach((invoice) => {
      const { label, fullName, group } = invoice;
      // set label if the account is an individual account
      if (fullName) invoice.label = `${label} - ${fullName}`
      // set label if the account is a group account, checking if the group exists ;)
      else if (groups?.[group]) invoice.label = `${label} - ${group}`
      else info('Something you need to double check')
    })

    return {
      balance: await account.get('balance'),
      overview,
      transactions,
      invoices,
    };
  } catch(errorOccured) { throw new Error(errorOccured); }
});

onClientCallback(
  'ox_banking:getAccountUsers',
  async (
    playerId,
    {
      accountId,
      page,
      search,
    }: {
      accountId: number;
      page: number;
      search?: string;
    }
  ): Promise<AccessTableData> => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'manageUser');
    const groups = await Bridge.GetGroups()

    if (!hasPermission) return;

    const wildcard = sanitizeSearch(search);
    let searchStr = '';

    const accountGroup = await account.get('group');

    const queryParams: any[] = [accountId];

    if (wildcard) {
      searchStr += `AND CONCAT(
        IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
        ' ', 
        IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
      ) LIKE ?`;
      queryParams.push(`%${wildcard}%`);
    }

    if (accountGroup) {
      const params: any[] = [accountGroup];

      const usersQuery = `
        SELECT p.citizenid As stateId, NULLIF(TRIM(CONCAT(
          IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
          )), '') AS name, NULL AS role, pg.group, pg.grade FROM player_groups pg
        LEFT JOIN accounts a ON pg.group = a.group
        LEFT JOIN players p ON p.citizenid = pg.citizenid
        WHERE pg.group = ? ${searchStr}
        ORDER BY role DESC
        LIMIT 12
        OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) FROM player_groups pg
        LEFT JOIN accounts a ON pg.group = a.group
        LEFT JOIN players p ON p.citizenid = pg.citizenid
        WHERE pg.group = ?
      `;

      const count = await oxmysql.prepare(countQuery, params);

      if (wildcard) params.push(wildcard);
      params.push(page * 12);

      const users = await oxmysql.rawExecute<Array<AccessTableUser & { role: any, group: string, grade: number }>>(usersQuery, params);
      users.forEach(user => {
        const { role, group, grade } = user
        if (!role) {
          const playerGrade = groups?.[group]?.grades?.[grade]
          if (playerGrade) {
            user.role = playerGrade.accountRole ?? (playerGrade.isboss ? accountRolesFallback[0] : accountRolesFallback[1])
          }
        }
      });

      return {
        numberOfPages: count,
        users,
      };
    }

    const usersCount = await oxmysql.prepare<number>(
      `SELECT COUNT(*) FROM \`accounts_access\` aa LEFT JOIN players p ON p.id = aa.charId WHERE accountId = ? ${searchStr}`,
      queryParams
    );

    queryParams.push(page * 12);

    const users = usersCount
      ? await oxmysql.rawExecute<AccessTableData['users']>(
          `
      SELECT p.citizenid as stateId, a.role, NULLIF(TRIM(CONCAT(
        IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
          ' ', 
          IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
        )), '') AS \`name\` FROM \`accounts_access\` a
      LEFT JOIN \`players\` p ON p.id = a.charId
      WHERE a.accountId = ?
      ${searchStr}
      ORDER BY a.role DESC
      LIMIT 12
      OFFSET ?
      `,
          queryParams
        )
      : [];

    return {
      numberOfPages: Math.ceil(usersCount / 12) || 1,
      users,
    };
  }
);

onClientCallback(
  'ox_banking:addUserToAccount',
  async (
    playerId,
    {
      accountId,
      stateId,
      role,
    }: {
      accountId: number;
      stateId: string;
      role: OxAccountRole;
    }
  ) => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'addUser');

    if (!hasPermission) return false;

    const currentRole = await account.getCharacterRole(stateId);

    if (currentRole) return { success: false, message: 'invalid_input' };

    return (await account.setCharacterRole(stateId, role)) || { success: false, message: 'state_id_not_exists' };
  }
);

onClientCallback(
  'ox_banking:manageUser',
  async (
    playerId,
    {
      accountId,
      targetStateId,
      values,
    }: {
      accountId: number;
      targetStateId: string;
      values: { role: OxAccountRole };
    }
  ) => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'manageUser');

    if (!hasPermission) return false;

    return await account.setCharacterRole(targetStateId, values.role);
  }
);

onClientCallback(
  'ox_banking:removeUser',
  async (playerId, { targetStateId, accountId }: { targetStateId: string; accountId: number }) => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'removeUser');

    if (!hasPermission) return false;

    return await account.setCharacterRole(targetStateId, null);
  }
);

onClientCallback(
  'ox_banking:transferOwnership',
  async (
    playerId,
    {
      targetStateId,
      accountId,
    }: {
      targetStateId: string;
      accountId: number;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'transferOwnership');

    if (!hasPermission)
      return {
        success: false,
        message: 'no_permission',
      };

    const targetCharId = await oxmysql.prepare<number | null>('SELECT `id` FROM `players` WHERE `citizenid` = ?', [
      targetStateId,
    ]);

    if (!targetCharId)
      return {
        success: false,
        message: 'state_id_not_exists',
      };

    const accountOwner = await account.get('owner');

    if (accountOwner === targetCharId)
      return {
        success: false,
        message: 'invalid_input',
      };

    const player = GetPlayer(playerId);

    await oxmysql.prepare(
      "INSERT INTO `accounts_access` (`accountId`, `charId`, `role`) VALUES (?, ?, 'owner') ON DUPLICATE KEY UPDATE `role` = 'owner'",
      [accountId, targetCharId]
    );

    await oxmysql.prepare('UPDATE `accounts` SET `owner` = ? WHERE `id` = ?', [targetCharId, accountId]);
    await oxmysql.prepare("UPDATE `accounts_access` SET `role` = 'manager' WHERE `accountId` = ? AND `charId` = ?", [
      accountId,
      player.charId,
    ]);

    return {
      success: true,
    };
  }
);

onClientCallback(
  'ox_banking:renameAccount',
  async (playerId, { accountId, name }: { accountId: number; name: string }) => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'manageAccount');

    if (!hasPermission) return;

    await oxmysql.prepare('UPDATE `accounts` SET `label` = ? WHERE `id` = ?', [name, accountId]);

    return true;
  }
);

onClientCallback('ox_banking:convertAccountToShared', async (playerId, { accountId }: { accountId: number }) => {
  const player = GetPlayer(playerId);

  if (!player.charId) return;

  const account = await GetAccount(accountId);

  if (!account) return;

  const { type, owner } = await account.get(['type', 'owner']);

  if (type !== 'personal' || owner !== player.charId) return;

  return await account.setShared();
});

onClientCallback(
  'ox_banking:getLogs',
  async (playerId, { accountId, filters }: { accountId: number; filters: LogsFilters }) => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'viewHistory');
    const groups = await Bridge.GetGroups()

    if (!hasPermission) return;

    const search = sanitizeSearch(filters.search);

    let dateSearchString = '';
    let queryParams: any[] = [accountId, accountId, accountId, accountId, accountId, accountId];

    let typeQueryString = ``;

    let queryWhere = `WHERE (at.fromId = ? OR at.toId = ?)`;

    if (search) {
      queryWhere +=
        ' AND (CONCAT(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, "$.firstname")), " ", JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, "$.lastname"))) LIKE ? OR at.message LIKE ?) ';
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam);
    }

    if (filters.type && filters.type !== 'combined') {
      typeQueryString += 'AND (';
      filters.type === 'outbound' ? (typeQueryString += 'at.fromId = ?)') : (typeQueryString += 'at.toId = ?)');

      queryParams.push(accountId);
    }

    if (filters.date) {
      const date = getFormattedDates(filters.date);

      dateSearchString = ` AND (DATE(at.date) BETWEEN ? AND ?)`;
      queryParams.push(date.from, date.to);
    }

    queryWhere += `${typeQueryString} ${dateSearchString}`;

    const countQueryParams = [...queryParams].slice(2, queryParams.length);

    queryParams.push(filters.page * 6);

    const queryData = await oxmysql
      .rawExecute<Array<RawLogItem & {
        fromAccountId: number
        fromAccountOwner: number
        fromAccountGroup: string
        toAccountOwner: number
        toAccountGroup: string
        toAccountId: number
      }>>(
        `
          SELECT
            at.id,
            at.fromId,
            at.toId,
            at.message,
            at.amount,
            fa.id AS fromAccountId,
            NULLIF(CONCAT(fa.id, ' - ', NULLIF(TRIM(CONCAT(
              IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pf.charinfo, '$.firstname')), ''), 
              ' ', 
              IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pf.charinfo, '$.lastname')), '')
            )), '')), fa.id) AS fromAccountLabel,
            fa.owner As fromAccountOwner,
            fa.group AS fromAccountGroup,
            ta.id As toAccountId,
            NULLIF(CONCAT(ta.id, ' - ', 
                NULLIF(TRIM(CONCAT(
                    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pt.charinfo, '$.firstname')), ''), 
                    ' ', 
                    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pt.charinfo, '$.lastname')), '')
                )), '')
            ), ta.id) AS toAccountLabel,
            UNIX_TIMESTAMP(at.date) AS date,
            ta.owner As toAccountOwner,
            ta.group As toAccountGroup,
            NULLIF(TRIM(CONCAT(
                IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pt.charinfo, '$.firstname')), ''), 
                ' ', 
                IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pt.charinfo, '$.lastname')), '')
            )), '') AS name,
            CASE
              WHEN at.toId = ? THEN 'inbound'
              ELSE 'outbound'
            END AS 'type',
            CASE
                WHEN at.toId = ? THEN at.toBalance
                ELSE at.fromBalance
            END AS newBalance
          FROM accounts_transactions at
          LEFT JOIN players p ON p.id = at.actorId
          LEFT JOIN accounts ta ON ta.id = at.toId
          LEFT JOIN accounts fa ON fa.id = at.fromId
          LEFT JOIN players pt ON (ta.owner IS NOT NULL AND at.fromId = ? AND pt.id = ta.owner)
          LEFT JOIN players pf ON (fa.owner IS NOT NULL AND at.toId = ? AND pf.id = fa.owner)
          ${queryWhere}
          ORDER BY at.id DESC
          LIMIT 6
          OFFSET ?
        `,
        queryParams
      )
      .catch((e) => console.log(e));

    if (queryData) queryData.forEach(data => {
      const {
        fromAccountLabel,
        fromAccountId,
        fromAccountOwner,
        fromAccountGroup,
        toId,
        toAccountLabel,
        toAccountOwner,
        fromId,
        toAccountGroup,
        toAccountId
      } = data
      // does the [ CONCAT(fa.id, ' - ', IFNULL(cf.fullName, ogf.label)) AS fromAccountLabel ]'s job
      if (
        !fromAccountLabel
        && fromAccountOwner
        && toId == queryParams[5]
        && groups?.[fromAccountGroup]
      ) data.fromAccountLabel = `${fromAccountId} - ${fromAccountGroup}`
      // does the [ CONCAT(ta.id, ' - ', IFNULL(ct.fullName, ogt.label)) AS toAccountLabel ]'s job
      if (
        !toAccountLabel
        && toAccountOwner
        && fromId == queryParams[4]
        && groups?.[toAccountGroup]
      ) data.toAccountLabel = `${toAccountId} - ${toAccountGroup}`
    });

    const totalLogsCount = await oxmysql
      .prepare(
        `
          SELECT COUNT(*)
          FROM accounts_transactions at
          LEFT JOIN players p ON p.id = at.actorId
          LEFT JOIN accounts ta ON ta.id = at.toId
          LEFT JOIN accounts fa ON fa.id = at.fromId
          LEFT JOIN players pt ON (ta.owner IS NOT NULL AND at.fromId = ? AND pt.id = ta.owner)
          LEFT JOIN players pf ON (fa.owner IS NOT NULL AND at.toId = ? AND pf.id = fa.owner)
          ${queryWhere}
        `,
        countQueryParams
      )
      .catch((e) => console.log(e));

    return {
      numberOfPages: Math.ceil(totalLogsCount / 6),
      logs: queryData,
    };
  }
);

onClientCallback(
  'ox_banking:getInvoices',
  async (playerId, { accountId, filters }: { accountId: number; filters: InvoicesFilters }) => {
    const account = await GetAccount(accountId);
    const hasPermission = await account?.playerHasPermission(playerId, 'payInvoice');
    const groups = await Bridge.GetGroups();

    if (!hasPermission) return;

    const search = sanitizeSearch(filters.search);

    let queryParams: any[] = [];

    let dateSearchString = '';
    let columnSearchString = '';
    let typeSearchString = '';

    let query = '';
    let queryJoins = '';

    switch (filters.type) {
      case 'unpaid':
        typeSearchString = '(ai.toAccount = ? AND ai.paidAt IS NULL)';

        queryParams.push(accountId);

        if (search) {
          columnSearchString =
            'AND (a.label LIKE ? OR ai.message LIKE ?)';
          queryParams.push(`%${search}%`, `%${search}%`);
        }

        queryJoins = `
        LEFT JOIN accounts a ON ai.fromAccount = a.id
        LEFT JOIN players p ON ai.actorId = p.id
        LEFT JOIN players po ON (a.owner IS NOT NULL AND po.id = a.owner)
      `;

        query = `
          SELECT
            ai.id,
            NULLIF(TRIM(CONCAT(
              IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
              ' ', 
              IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
            )), '') as sentBy,
            a.id as accountId,
            NULLIF(TRIM(CONCAT(
              IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.firstname')), ''), 
              ' ', 
              IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.lastname')), '')
            )), '') as ownerName,
            a.owner,
            a.group,
            a.label,
            ai.amount,
            ai.message,
            UNIX_TIMESTAMP(ai.sentAt) AS sentAt,
            UNIX_TIMESTAMP(ai.dueDate) as dueDate,
            'unpaid' AS type
          FROM accounts_invoices ai
          ${queryJoins}
      `;

        break;
      case 'paid':
        typeSearchString = '(ai.toAccount = ? AND ai.paidAt IS NOT NULL)';

        queryParams.push(accountId);

        if (search) {
          columnSearchString = `AND (CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
          ) LIKE ? OR ai.message LIKE ? OR a.label LIKE ?)`;
          queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        queryJoins = `
        LEFT JOIN accounts a ON ai.fromAccount = a.id
        LEFT JOIN players p ON ai.payerId = p.id
        LEFT JOIN players pa ON ai.actorId = pa.id
        LEFT JOIN players po ON (a.owner IS NOT NULL AND po.id = a.owner)
      `;

        query = `
        SELECT
          ai.id,
          NULLIF(TRIM(CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
          )), '') as paidBy,
          NULLIF(TRIM(CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pa.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(pa.charinfo, '$.lastname')), '')
          )), '') as sentBy,
          a.id as accountId,
          NULLIF(TRIM(CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.lastname')), '')
          )), '') as ownerName,
          a.owner,
          a.group,
          a.label,
          ai.amount,
          ai.message,
          UNIX_TIMESTAMP(ai.sentAt) AS sentAt,
          UNIX_TIMESTAMP(ai.dueDate) AS dueDate,
          UNIX_TIMESTAMP(ai.paidAt) AS paidAt,
          'paid' AS type
        FROM accounts_invoices ai
        ${queryJoins}
      `;

        break;
      case 'sent':
        typeSearchString = '(ai.fromAccount = ?)';

        queryParams.push(accountId);

        if (search) {
          columnSearchString = `AND (CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
          ) LIKE ? OR ai.message LIKE ? OR a.label LIKE ?)`;
          queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        queryJoins = `
        LEFT JOIN accounts a ON ai.toAccount = a.id
        LEFT JOIN players p ON ai.actorId = p.id
        LEFT JOIN players po ON (a.owner IS NOT NULL AND po.id = a.owner)
      `;

        query = `
        SELECT
          ai.id,
          NULLIF(TRIM(CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p.charinfo, '$.lastname')), '')
          )), '') as sentBy,
          a.id as accountId,
          NULLIF(TRIM(CONCAT(
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.firstname')), ''), 
            ' ', 
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(po.charinfo, '$.lastname')), '')
          )), '') as ownerName,
          a.owner,
          a.group,
          a.label,
          ai.amount,
          ai.message,
          UNIX_TIMESTAMP(ai.sentAt) AS sentAt,
          UNIX_TIMESTAMP(ai.dueDate) AS dueDate,
          CASE
            WHEN ai.payerId IS NOT NULL THEN 'paid'
            WHEN NOW() > ai.dueDate THEN 'overdue'
            ELSE 'sent'
          END AS status,
          'sent' AS type
        FROM accounts_invoices ai
        ${queryJoins}
      `;

        break;
    }

    if (filters.date) {
      const date = getFormattedDates(filters.date);
      const dateCol = filters.type === 'unpaid' ? 'ai.dueDate' : filters.type === 'paid' ? 'ai.paidAt' : 'ai.sentAt';

      dateSearchString = `AND (DATE(${dateCol}) BETWEEN ? AND ?)`;
      queryParams.push(date.from, date.to);
    }

    const whereStatement = `WHERE ${typeSearchString} ${columnSearchString} ${dateSearchString}`;

    queryParams.push(filters.page * 6);

    const result = await oxmysql
      .rawExecute<Array<unknown & {
        accountId: number
        ownerName: string
        group: string
        label: string
      }>>(
        `
    ${query}
    ${whereStatement}
    ORDER BY ai.id DESC
    LIMIT 6
    OFFSET ?
  `,
        queryParams
      )
      .catch((e) => console.log(e));

    // Process labels in code
    if (result) {
      result.forEach(invoice => {
        const { accountId, ownerName, group } = invoice;
        
        if (ownerName) {
          invoice.label = `${accountId} - ${ownerName}`;
        } else if (groups?.[group]) {
          invoice.label = `${accountId} - ${group}`;
        }
      });
    }

    queryParams.pop();
    const totalInvoices = await oxmysql
      .prepare(
        `
        SELECT COUNT(*)
        FROM accounts_invoices ai
        ${queryJoins}
        ${whereStatement}`,
        queryParams
      )
      .catch((e) => console.log(e));
    const numberOfPages = Math.ceil(totalInvoices / 6);

    return {
      invoices: result,
      numberOfPages,
    };
  }
);

onClientCallback('ox_banking:payInvoice', async (playerId, data: { invoiceId: number }) => {
  const player = GetPlayer(playerId);

  if (!player.charId) return;

  return await player.payInvoice(data.invoiceId);
});

function getFormattedDates(date: DateRange) {
  const rawDates = {
    from: new Date(date.from),
    to: new Date(date.to ?? date.from),
  };

  const formattedDates = {
    from: new Date(
      Date.UTC(rawDates.from.getFullYear(), rawDates.from.getMonth(), rawDates.from.getDate(), 0, 0, 0)
    ).toISOString(),
    to: new Date(
      Date.UTC(rawDates.to.getFullYear(), rawDates.to.getMonth(), rawDates.to.getDate(), 23, 59, 59)
    ).toISOString(),
  };

  return formattedDates;
}

function sanitizeSearch(search: string) {
  const trimmed = search?.trim();
  return trimmed ? trimmed : null;
}
