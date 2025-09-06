import { ClassInterface } from 'classInterface';
import type { Dict, OxAccountMetadata, OxAccountRole, OxAccountPermissions, OxCreateInvoice } from '../../types';
interface UpdateAccountBalance {
    amount: number;
    message?: string;
}
interface RemoveAccountBalance extends UpdateAccountBalance {
    overdraw?: boolean;
}
interface TransferAccountBalance {
    toId: number;
    amount: number;
    overdraw?: boolean;
    message?: string;
    note?: string;
    actorId?: number;
}
export declare class OxAccount extends ClassInterface {
    accountId: number;
    protected static members: Dict<OxAccount>;
    static get(accountId: number): Promise<OxAccount>;
    static getAll(): Dict<OxAccount>;
    constructor(accountId: number);
    get<T extends keyof OxAccountMetadata>(key: T): Promise<OxAccountMetadata[T]>;
    get<T extends keyof OxAccountMetadata>(keys: T[]): Promise<Pick<OxAccountMetadata, T>>;
    addBalance({ amount, message }: UpdateAccountBalance): Promise<{
        success: boolean;
        message?: string;
    }>;
    removeBalance({ amount, overdraw, message }: RemoveAccountBalance): Promise<{
        success: boolean;
        message?: string;
    }>;
    transferBalance({ toId, amount, overdraw, message, note, actorId }: TransferAccountBalance): Promise<{
        success: boolean;
        message?: string;
    }>;
    depositMoney(playerId: number, amount: number, message?: string, note?: string): Promise<{
        success: boolean;
        message?: string;
    }>;
    withdrawMoney(playerId: number, amount: number, message?: string, note?: string): Promise<{
        success: boolean;
        message?: string;
    }>;
    deleteAccount(): Promise<{
        success: boolean;
        message?: string;
    }>;
    getCharacterRole(id: number | string): Promise<OxAccountRole | null>;
    setCharacterRole(id: number | string, role?: OxAccountRole): Promise<0 | {
        success: boolean;
        message?: string;
    } | null>;
    playerHasPermission(playerId: number, permission: keyof OxAccountPermissions): Promise<boolean>;
    setShared(): Promise<{
        success: boolean;
        message?: string;
    }>;
    createInvoice(data: Omit<OxCreateInvoice, 'fromAccount'>): Promise<{
        success: boolean;
        message?: string;
    }>;
}
export {};
