import { Connection, GetConnection } from "./db";
import { getRandomInt } from '@communityox/ox_lib';

const doesAccountExist = 'SELECT 1 FROM accounts WHERE id = ?';

const GenerateAccountId = async (conn: Connection) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const baseId = Number(year + month) * 1e3;

  while (true) {
    const accountId = getRandomInt(10, 99) * 1e7 + baseId + getRandomInt(0, 9999);
    const existingId = await conn.scalar<number>(doesAccountExist, [accountId]);

    if (!existingId) return accountId;
  }
}

export const CreateNewAccount = async (owner: string | number, label: string, isDefault?: boolean) => {
  using conn = await GetConnection();

  const accountId = await GenerateAccountId(conn);
  const column = typeof owner === 'string' ? 'group' : 'owner';
  const result = await conn.update(
    `INSERT INTO accounts (id, label, \`${column}\`, type, isDefault) VALUES (?, ?, ?, ?, ?)`,
    [accountId, label, owner, column === 'group' ? 'group' : 'personal', isDefault || 0],
  );

  if (result && column === 'owner')
    conn.execute('INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?)', [accountId, owner, 'owner']);

  return accountId;
}