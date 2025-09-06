import type { OxAccount as _OxAccount } from '../../server/accounts/class';
declare class AccountInterface {
    accountId: number;
    constructor(accountId: number);
}
export type OxAccount = _OxAccount & AccountInterface;
export declare function GetAccount(accountId: number): Promise<OxAccount | undefined>;
export declare function GetCharacterAccount(charId: number | string): Promise<OxAccount | undefined>;
export declare function GetGroupAccount(groupName: string): Promise<OxAccount | undefined>;
export declare function CreateAccount(owner: number | string, label: string): Promise<OxAccount | undefined>;
export {};
