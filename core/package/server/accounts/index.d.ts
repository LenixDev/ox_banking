import { OxAccount } from './class';
export declare function GetCharacterAccount(id: number | string): Promise<OxAccount | null>;
export declare function GetGroupAccount(groupName: string): Promise<OxAccount | null>;
export declare function CreateAccount(owner: number | string, label: string): Promise<OxAccount>;
export declare function PayAccountInvoice(invoiceId: number, charId: number): Promise<{
    success: boolean;
    message?: string;
}>;
export declare function DeleteAccountInvoice(invoiceId: number): Promise<{
    success: boolean;
    message?: string;
}>;
