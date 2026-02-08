/**
 * @copyright Adapted by Lenix <https://github.com/lenixdev> - Original: ox_core by CommunityOx
*/

import { oxmysql } from "@communityox/oxmysql"
import './pool'

setImmediate(async () => {
  await oxmysql.query(`
    CREATE TABLE IF NOT EXISTS account_roles (
      id INT(11) NOT NULL AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL DEFAULT '',
      deposit TINYINT(1) NOT NULL DEFAULT '0',
      withdraw TINYINT(1) NOT NULL DEFAULT '0',
      addUser TINYINT(1) NOT NULL DEFAULT '0',
      removeUser TINYINT(1) NOT NULL DEFAULT '0',
      manageUser TINYINT(1) NOT NULL DEFAULT '0',
      transferOwnership TINYINT(1) NOT NULL DEFAULT '0',
      viewHistory TINYINT(1) NOT NULL DEFAULT '0',
      manageAccount TINYINT(1) NOT NULL DEFAULT '0',
      closeAccount TINYINT(1) NOT NULL DEFAULT '0',
      sendInvoice TINYINT(1) NOT NULL DEFAULT '0',
      payInvoice TINYINT(1) NOT NULL DEFAULT '0',
      PRIMARY KEY (id),
      UNIQUE INDEX name (name)
    )
  `)
    
  await oxmysql.query(`
    INSERT INTO account_roles (id, name, deposit, withdraw, addUser, removeUser, manageUser, transferOwnership, viewHistory, manageAccount, closeAccount, sendInvoice, payInvoice) VALUES
      (1, 'viewer', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
      (2, 'contributor', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
      (3, 'manager', 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1),
      (4, 'owner', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    ON DUPLICATE KEY UPDATE id=id
  `)
  
  await oxmysql.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INT UNSIGNED NOT NULL PRIMARY KEY,
      label VARCHAR(50) NOT NULL,
      owner INT UNSIGNED NULL,
      \`group\` VARCHAR(20) NULL,
      balance INT DEFAULT 0 NOT NULL,
      isDefault TINYINT(1) DEFAULT 0 NOT NULL,
      type ENUM ('personal', 'shared', 'group', 'inactive') DEFAULT 'personal' NOT NULL,
      CONSTRAINT accounts_owner_fk
        FOREIGN KEY (owner) REFERENCES players (id)
          ON UPDATE SET NULL ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
//@ts-expect-error unused, used to ensures data integrity
// CONSTRAINT accounts_group_fk
//         FOREIGN KEY (\`group\`) REFERENCES ox_groups (name)
//           ON UPDATE SET NULL ON DELETE SET NULL,
  
  await oxmysql.query(`
    CREATE TABLE IF NOT EXISTS accounts_access (
      accountId INT UNSIGNED NOT NULL,
      charId INT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      PRIMARY KEY (accountId, charId),
      CONSTRAINT accounts_access_accountId_fk FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT accounts_access_charId_fk FOREIGN KEY (charId) REFERENCES players (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT FK_accounts_access_account_roles FOREIGN KEY (role) REFERENCES account_roles (name) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `)
  
  await oxmysql.query(`
    CREATE TABLE IF NOT EXISTS accounts_transactions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      actorId INT DEFAULT NULL,
      fromId INT UNSIGNED DEFAULT NULL,
      toId INT UNSIGNED DEFAULT NULL,
      amount INT NOT NULL,
      message VARCHAR(255) NOT NULL,
      note VARCHAR(255) DEFAULT NULL,
      fromBalance INT DEFAULT NULL,
      toBalance INT DEFAULT NULL,
      date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT accounts_transactions_actorId_fk FOREIGN KEY (actorId) REFERENCES players (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT accounts_transactions_fromId_fk FOREIGN KEY (fromId) REFERENCES accounts (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT accounts_transactions_toId_fk FOREIGN KEY (toId) REFERENCES accounts (id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  
  await oxmysql.query(`
    CREATE TABLE IF NOT EXISTS accounts_invoices(
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      actorId INT NULL,
      payerId INT NULL,
      fromAccount INT UNSIGNED NOT NULL,
      toAccount INT UNSIGNED NOT NULL,
      amount INT UNSIGNED NOT NULL,
      message VARCHAR(255) NULL,
      sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
      dueDate TIMESTAMP NOT NULL,
      paidAt TIMESTAMP NULL,
      CONSTRAINT accounts_invoices_accounts_id_fk
          FOREIGN KEY (fromAccount) REFERENCES accounts (id),
      CONSTRAINT accounts_invoices_accounts_id_fk_2
          FOREIGN KEY (toAccount) REFERENCES accounts (id),
      CONSTRAINT accounts_invoices_characters_charId_fk
          FOREIGN KEY (payerId) REFERENCES players (id),
      CONSTRAINT accounts_invoices_characters_charId_fk_2
          FOREIGN KEY (actorId) REFERENCES players (id)
    )
  `)
})