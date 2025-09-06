import type { OxAccountMetadata, OxAccountRole, OxCreateInvoice } from '../../types';
export declare function UpdateBalance(accountId: number, amount: number, action: 'add' | 'remove', overdraw: boolean, message?: string, note?: string, actorId?: number): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function PerformTransaction(fromId: number, toId: number, amount: number, overdraw: boolean, message?: string, note?: string, actorId?: number): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function SelectAccounts(column: 'owner' | 'group' | 'id', id: number | string): Promise<OxAccountMetadata[]>;
export declare function SelectDefaultAccountId(column: 'owner' | 'group' | 'id', id: number | string): Promise<number | null>;
export declare function SelectAccount(id: number): Promise<OxAccountMetadata | null>;
export declare function IsAccountIdAvailable(id: number): Promise<boolean>;
export declare function CreateNewAccount(owner: string | number, label: string, isDefault?: boolean): Promise<number>;
export declare function DeleteAccount(accountId: number): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function SelectAccountRole(accountId: number, charId: number): Promise<OxAccountRole | null>;
export declare function DepositMoney(playerId: number, accountId: number, amount: number, message?: string, note?: string): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function WithdrawMoney(playerId: number, accountId: number, amount: number, message?: string, note?: string): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function UpdateAccountAccess(accountId: number, id: number, role?: string): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function UpdateInvoice(invoiceId: number, charId: number): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function CreateInvoice({ actorId, fromAccount, toAccount, amount, message, dueDate, }: OxCreateInvoice): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function DeleteInvoice(invoiceId: number): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function SetAccountType(accountId: number, type: string): Promise<{
    success: boolean;
    message?: string;
}>;
