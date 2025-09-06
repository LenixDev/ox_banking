import type { Dict } from '../types';
export declare class ClassInterface {
    protected static members: Dict<any>;
    protected static keys?: Dict<Dict<any>>;
    protected static callableMethods: Dict<true>;
    static isCallValid(method: string, id: string | number, member: any): true | void;
    static init(): typeof ClassInterface;
    call(method: string, ...args: any): any;
    static get(id: string | number): any;
    static getAll(): Dict<any>;
    static add(id: string | number, member: any): boolean;
    static remove(id: string | number): boolean;
}
