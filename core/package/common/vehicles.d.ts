import type { VehicleCategories, VehicleData, VehicleStats, Vehicles } from '../types';
export declare function GetTopVehicleStats(): Record<VehicleCategories, VehicleStats>;
export declare function GetTopVehicleStats(category: VehicleCategories): VehicleStats;
export declare function GetVehicleData(): Vehicles;
export declare function GetVehicleData<T extends string>(filter: T): VehicleData;
export declare function GetVehicleData<T extends string[]>(filter: T): {
    [K in T[number]]: VehicleData;
};
export declare function GetVehicleNetworkType(modelName: string): "bike" | "heli" | "automobile" | "boat" | "plane" | "submarine" | "trailer" | "train";
