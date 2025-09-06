import type { OxPlayer } from '../../client/player';
declare class PlayerInterface {
    userId: number;
    charId?: number;
    stateId?: string;
    [key: string]: any;
    constructor();
    on(key: string, callback: (data: unknown) => void): void;
    get(key: string): any;
    getCoords(): number[];
}
export type OxPlayer = typeof OxPlayer & PlayerInterface;
export declare function GetPlayer(): OxPlayer;
export {};
