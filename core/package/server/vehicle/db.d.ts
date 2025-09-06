import type { VehicleProperties } from '@communityox/ox_lib';
export type VehicleRow = {
    id: number;
    owner?: number;
    group?: string;
    plate: string;
    vin: string;
    model: string;
    data: {
        properties: Partial<VehicleProperties>;
        [key: string]: any;
    };
};
export declare function IsPlateAvailable(plate: string): Promise<boolean>;
export declare function IsVinAvailable(plate: string): Promise<boolean>;
export declare function GetStoredVehicleFromId(id: number | string, column?: string): Promise<VehicleRow | null>;
export declare function SetVehicleColumn(id: number | void, column: string, value: any): Promise<boolean | undefined>;
export declare function SaveVehicleData(values: any, batch?: boolean): Promise<number> | Promise<import("mariadb/*").UpsertResult | import("mariadb/*").UpsertResult[]>;
export declare function CreateNewVehicle(plate: string, vin: string, owner: number | null, group: string | null, model: string, vehicleClass: number, data: object, stored: string | null): Promise<number>;
export declare function DeleteVehicle(id: number): Promise<boolean>;
