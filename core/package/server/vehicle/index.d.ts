import { OxVehicle, Vec3 } from './class';
import { type VehicleRow } from './db';
import './class';
import './commands';
import './events';
import type { VehicleProperties } from '@communityox/ox_lib/server';
export interface CreateVehicleData {
    model: string;
    owner?: number;
    group?: string;
    stored?: string;
    properties?: Partial<VehicleProperties>;
}
export declare function CreateVehicle(data: string | (CreateVehicleData & Partial<VehicleRow>), coords?: Vec3, heading?: number, invokingScript?: string): Promise<OxVehicle>;
export declare function SpawnVehicle(id: number | string, coords?: Vec3, heading?: number): Promise<OxVehicle | undefined>;
