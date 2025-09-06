class AccountInterface {
    accountId;
    constructor(accountId) {
        this.accountId = accountId;
    }
}
Object.keys(exports.ox_core.GetAccountCalls()).forEach((method) => {
    AccountInterface.prototype[method] = function (...args) {
        return exports.ox_core.CallAccount(this.accountId, method, ...args);
    };
});
AccountInterface.prototype.toString = function () {
    return JSON.stringify(this, null, 2);
};
function CreateAccountInstance(account) {
    if (!account)
        return;
    return new AccountInterface(account.accountId);
}
export async function GetAccount(accountId) {
    const account = await exports.ox_core.GetAccount(accountId);
    return CreateAccountInstance(account);
}
export async function GetCharacterAccount(charId) {
    const account = await exports.ox_core.GetCharacterAccount(charId);
    return CreateAccountInstance(account);
}
export async function GetGroupAccount(groupName) {
    const account = await exports.ox_core.GetGroupAccount(groupName);
    return CreateAccountInstance(account);
}
export async function CreateAccount(owner, label) {
    const account = await exports.ox_core.CreateAccount(owner, label);
    return CreateAccountInstance(account);
}
