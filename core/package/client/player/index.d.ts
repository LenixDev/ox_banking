import type { Dict, OxStatus, PlayerMetadata } from '../../types';
export declare const Statuses: Dict<OxStatus>;
declare class PlayerSingleton {
    #private;
    userId: number;
    charId?: number;
    stateId?: string;
    constructor();
    get isLoaded(): boolean;
    set isLoaded(state: boolean);
    get state(): StateBagInterface;
    get<K extends string>(key: K | keyof PlayerMetadata): K extends keyof PlayerMetadata ? PlayerMetadata[K] : any;
    getGroup(filter: string): number;
    getGroup(filter: string[] | Record<string, number>): [string, number] | [];
    getGroupByType(type: string): [] | [string, number];
    getGroups(): Dict<number>;
    getStatus(name: string): number;
    getStatuses(): Dict<number>;
    setStatus(name: string, value: number): boolean;
    addStatus(name: string, value: number): boolean;
    removeStatus(name: string, value: number): boolean;
    hasPermission(permission: string): boolean;
}
export declare const OxPlayer: PlayerSingleton;
import './status';
export {};
