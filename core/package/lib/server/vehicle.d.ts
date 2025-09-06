import type { OxVehicle as _OxVehicle } from '../../server/vehicle/class';
import type { CreateVehicleData } from '../../server/vehicle';
import type { VehicleRow } from '../../server/vehicle/db';
import { Dict } from '../../types';
declare class VehicleInterface {
    entity: number | undefined;
    netId: number | undefined;
    script: string;
    plate: string;
    model: string;
    make: string;
    id?: number | undefined;
    vin?: string | undefined;
    owner?: number | undefined;
    group?: string | undefined;
    constructor(entity: number | undefined, netId: number | undefined, script: string, plate: string, model: string, make: string, id?: number | undefined, vin?: string | undefined, owner?: number | undefined, group?: string | undefined);
    getCoords(): number[] | null;
    getState(): StateBagInterface | null;
}
export type OxVehicle = _OxVehicle & VehicleInterface;
export declare function GetVehicle(entityId: number): OxVehicle;
export declare function GetVehicle(vin: string): OxVehicle;
export declare function GetVehicleFromEntity(entityId: number): OxVehicle;
export declare function GetVehicleFromNetId(netId: number): OxVehicle;
export declare function GetVehicleFromVin(vin: string): OxVehicle;
export declare function GetVehicles(filter?: Dict<any>): OxVehicle[];
export declare function GetVehicleFromFilter(filter: Dict<any>): OxVehicle;
export declare function CreateVehicle(data: string | (CreateVehicleData & Partial<VehicleRow>), coords?: number | number[] | {
    x: number;
    y: number;
    z: number;
}, heading?: number): Promise<OxVehicle>;
export declare function SpawnVehicle(dbId: number, coords: number | number[] | {
    x: number;
    y: number;
    z: number;
}, heading?: number): Promise<OxVehicle>;
export {};
