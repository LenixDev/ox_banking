# ox_banking

A complete banking system for FiveM for the [ox_core](https://github.com/communityox/ox_core) framework implementing shared accounts, logs, invoices and more.

![](https://img.shields.io/github/downloads/communityox/ox_banking/total?logo=github)
![](https://img.shields.io/github/downloads/communityox/ox_banking/latest/total?logo=github)
![](https://img.shields.io/github/contributors/communityox/ox_banking?logo=github)
![](https://img.shields.io/github/v/release/communityox/ox_banking?logo=github)

## 🔗 Links
- 💾 [Download](https://github.com/communityox/ox_banking/releases/latest/download/ox_banking.zip)
  - Download the latest release directly.
- 📽️ [Showcase](https://youtu.be/WJhNDEC4Zys)
  - Watch the video showcase of the resource.
- 🛤️ [Cfx.re](https://forum.cfx.re/t/free-ox-banking/5277542)
  - See our release thread for discussions or other information.

## ✨ Features

### Dashboard

- Weekly overview of income and expenses on the default account
- Overview of recent transactions and invoices

### Accounts

- Ability to create new accounts
- Shared and group accounts
- Withdraw, deposit and transfer balance from an acccount
- See unpaid, paid and sent invoices for an account
- Overview of account balanace changes with logs
- Abiltiy to convert personal accounts to shared
- Access management for shared accounts
- Access for group accounts based on group grades

### ATM

- Withdraw only ATMs placed throughout the map

## 📦 Dependencies

- [ox_core](https://github.com/communityox/ox_core)
- [ox_inventory](https://github.com/communityox/ox_inventory)
- [ox_lib](https://github.com/communityox/ox_lib)
- [oxmysql](https://github.com/communityox/oxmysql)

## Installation
1. Install bun if you don't have it
```bash
npm i -g bun # the last `npm` command you'll ever need
```

2. If you want to use precise account roles, you can add to each grade a role, otherwise the system with use `isboss` to determine whether to give the grade a `viewer` role or a `manager` role
e.g.
```lua
['police'] = {
  label = 'LSPD',
  type = 'leo',
  defaultDuty = true,
  offDutyPay = false,
  grades = {
    [0] = {
      name = 'Recruit',
      payment = 50,
      accountRole = 'viewer'
    },
    [1] = {
      name = 'Officer',
      payment = 75,
      accountRole = 'viewer'
    },
    [2] = {
      name = 'Sergeant',
      payment = 100,
      accountRole = 'contributor'
    },
    [3] = {
      name = 'Lieutenant',
      payment = 125,
      accountRole = 'manager'
    },
    [4] = {
      name = 'Chief',
      isboss = true,
      bankAuth = true,
      payment = 150,
      accountRole = 'owner'
    },
  },
},
```

## Acknowledge
- Adapted by: Lenix (https://github.com/lenixdev)