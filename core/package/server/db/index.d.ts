import type { Dict } from '../../types';
import type { PoolConnection, QueryOptions } from 'mariadb';
export interface MySqlRow<T = string | number | boolean | Dict<any> | undefined> {
    [column: string]: T;
}
export interface OkPacket {
    affectedRows: number;
    insertId: number;
    warningStatus: any;
}
export declare class Connection {
    connection: PoolConnection;
    transaction?: boolean;
    constructor(connection: PoolConnection);
    execute<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]): Promise<T>;
    query<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]): Promise<T>;
    scalar<T>(query: string | QueryOptions, values?: any[]): Promise<T | null>;
    row<T>(query: string | QueryOptions, values?: any[]): Promise<T | null>;
    insert(query: string | QueryOptions, values?: any[]): Promise<number>;
    update(query: string | QueryOptions, values?: any[]): Promise<number>;
    batch(query: string | QueryOptions, values?: any[]): Promise<import("mariadb").UpsertResult | import("mariadb").UpsertResult[]>;
    beginTransaction(): Promise<void>;
    rollback(): Promise<void>;
    commit(): Promise<void>;
    [Symbol.dispose](): void;
}
export declare function GetConnection(): Promise<Connection>;
export declare const db: {
    query<T>(query: string | QueryOptions, values?: any[]): Promise<T extends OkPacket ? OkPacket : T[]>;
    execute<T>(query: string | QueryOptions, values?: any[]): Promise<T extends OkPacket ? OkPacket : T[]>;
    column<T>(query: string | QueryOptions, values?: any[]): Promise<T | null>;
    exists<T>(query: string | QueryOptions, values?: any[]): Promise<boolean>;
    row<T>(query: string | QueryOptions, values?: any[]): Promise<T | null>;
    insert(query: string | QueryOptions, values?: any[]): Promise<number>;
    update(query: string | QueryOptions, values?: any[]): Promise<number>;
    batch(query: string | QueryOptions, values?: any[]): Promise<import("mariadb").UpsertResult | import("mariadb").UpsertResult[]>;
    scalar<T>(resp: T[] | null): T | null;
    single<T>(resp: T[] | null): T | null;
};
