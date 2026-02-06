import { Dict } from '@communityox/ox_core'
import { createPool, type Pool, type PoolConfig } from 'mariadb'
export let pool: Pool

const GetConfig = (): PoolConfig => {
  const connectionString = GetConvar('mysql_connection_string', 'mysql://root@localhost').replace(
    'mysql://',
    'mariadb://',
  )

  function parseUri() {
    const splitMatchGroups = connectionString.match(
      /^(?:([^:\/?#.]+):)?(?:\/\/(?:([^\/?#]*)@)?([\w\d\-\u0100-\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\?([^#]*))?$/,
    ) as RegExpMatchArray

    if (!splitMatchGroups) throw new Error(`mysql_connection_string structure was invalid (${connectionString})`)

    const authTarget = splitMatchGroups[2] ? splitMatchGroups[2].split(':') : []

    return {
      user: authTarget[0] || undefined,
      password: authTarget[1] || undefined,
      host: splitMatchGroups[3],
      port: Number.parseInt(splitMatchGroups[4]),
      database: splitMatchGroups[5].replace(/^\/+/, ''),
      ...(splitMatchGroups[6] &&
        splitMatchGroups[6].split('&').reduce<Dict<string>>((connectionInfo, parameter) => {
          const [key, value] = parameter.split('=')
          connectionInfo[key] = value
          return connectionInfo
        }, {})),
    }
  }

  const options: any = connectionString.includes('mariadb://')
    ? parseUri()
    : connectionString
        .replace(/(?:host(?:name)|ip|server|data\s?source|addr(?:ess)?)=/gi, 'host=')
        .replace(/(?:user\s?(?:id|name)?|uid)=/gi, 'user=')
        .replace(/(?:pwd|pass)=/gi, 'password=')
        .replace(/(?:db)=/gi, 'database=')
        .split('')
        .reduce((connectionInfo: any, parameter: any) => {
          const [key, value] = parameter.split('=')
          if (key) connectionInfo[key] = value
          return connectionInfo
        }, {})

  if (typeof options.ssl === 'string') {
    try {
      options.ssl = JSON.parse(options.ssl)
    } catch (err) {
      console.log(`^3Failed to parse ssl in configuration (${err})!^0`)
    }
  }

  return {
    connectTimeout: 60000,
    connectionLimit: 5,
    acquireTimeout: 30000,
    ...options,
    namedPlaceholders: false,
    multipleStatements: true,
    dateStrings: true,
    insertIdAsNumber: true,
    decimalAsNumber: true,
    autoJsonMap: true,
    jsonStrings: false,
  }
}

/**
 * Validate some database settings, tables, etc. and add anything missing (e.g. version changes).
 */
const schema = async (pool: Pool) => {
  await pool.query(`CREATE TABLE IF NOT EXISTS user_tokens (
    userId INT UNSIGNED NOT NULL,
    token VARCHAR(50) NOT NULL,
    PRIMARY KEY (userId, token),
    INDEX token (token),
    CONSTRAINT FK_user_tokens_users FOREIGN KEY (userId) REFERENCES users (userId) ON UPDATE CASCADE ON DELETE CASCADE
  )`)

  await pool.query(`CREATE TABLE IF NOT EXISTS banned_users (
    userId INT UNSIGNED NOT NULL,
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unban_at TIMESTAMP DEFAULT NULL,
    reason VARCHAR(255),
    PRIMARY KEY (userId),
    CONSTRAINT FK_banned_users_users FOREIGN KEY (userId) REFERENCES users (userId) ON UPDATE CASCADE ON DELETE CASCADE
  )`)
}

setImmediate(async () => {
  const config = GetConfig()

  try {
    const dbPool = createPool(config)
    const conn = await dbPool.getConnection()
    const info = conn.info! // when would info be null? i'm sure we'll find out eventually!
    const version = info.serverVersion
    const recommendedDb =
      'Install MariaDB 11.4+ for the best experience.\n- https://mariadb.com/kb/en/changes-improvements-in-mariadb-11-4/'

    conn.release()

    if (!version.mariaDb) return console.error(`MySQL ${version?.raw} is not supported. ${recommendedDb}`)

    if (!info.hasMinVersion(11, 4, 0)) return console.error(`${version.raw} is not supported. ${recommendedDb}`)

    console.log(`${`^5[${version.raw}]`} ^2Database server connection established!^0`)

    await schema(dbPool)

    pool = dbPool
  } catch (err) {
    console.log(
      `^3Unable to establish a connection to the database (${err.code})!\n^1Error ${err.errno}: ${err.message}^0`,
    )

    if (config.password) config.password = '******'

    console.log(config)
  }
})
