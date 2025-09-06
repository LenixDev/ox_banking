import type { GetTopVehicleStats, GetVehicleData, GetVehicleNetworkType } from '../common/vehicles';
import type { OxGroup } from '../types';
export type * from '../types';
export interface OxCommon {
    [key: string]: (...args: any[]) => any;
    GetTopVehicleStats: typeof GetTopVehicleStats;
    GetVehicleData: typeof GetVehicleData;
    GetVehicleNetworkType: typeof GetVehicleNetworkType;
}
export declare const Ox: OxCommon;
export declare function GetGroup(name: string): OxGroup;
