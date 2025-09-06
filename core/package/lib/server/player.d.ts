import type { OxPlayer as _OxPlayer } from '../../server/player/class';
import type { Dict } from '../../types';
declare class PlayerInterface {
    source: number;
    userId: number;
    charId: number | undefined;
    stateId: string | undefined;
    username: string;
    identifier: string;
    ped: number;
    state: StateBagInterface;
    constructor(source: number, userId: number, charId: number | undefined, stateId: string | undefined, username: string, identifier: string, ped: number);
    getCoords(): number[];
    getState(): StateBagInterface;
    getAccount(): Promise<import("./account").OxAccount | null | undefined>;
}
export type OxPlayer = _OxPlayer & PlayerInterface;
export declare function GetPlayer(playerId: string | number): OxPlayer | undefined;
export declare function GetPlayerFromUserId(userId: number): OxPlayer | undefined;
export declare function GetPlayerFromCharId(charId: number): OxPlayer | undefined;
export declare function GetPlayers(filter?: Dict<any>): OxPlayer[];
export declare function GetPlayerFromFilter(filter: Dict<any>): OxPlayer | undefined;
export {};
