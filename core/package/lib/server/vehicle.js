class VehicleInterface {
    entity;
    netId;
    script;
    plate;
    model;
    make;
    id;
    vin;
    owner;
    group;
    constructor(entity, netId, script, plate, model, make, id, vin, owner, group) {
        this.entity = entity;
        this.netId = netId;
        this.script = script;
        this.plate = plate;
        this.model = model;
        this.make = make;
        this.id = id;
        this.vin = vin;
        this.owner = owner;
        this.group = group;
        this.entity = entity;
        this.netId = netId;
        this.script = script;
        this.plate = plate;
        this.model = model;
        this.make = make;
        this.id = id;
        this.vin = vin;
        this.owner = owner;
        this.group = group;
    }
    getCoords() {
        return this.entity ? GetEntityCoords(this.entity) : null;
    }
    getState() {
        return this.entity ? Entity(this.entity).state : null;
    }
}
Object.keys(exports.ox_core.GetVehicleCalls()).forEach((method) => {
    VehicleInterface.prototype[method] = function (...args) {
        return exports.ox_core.CallVehicle(this.vin, method, ...args);
    };
});
VehicleInterface.prototype.toString = function () {
    return JSON.stringify(this, null, 2);
};
function CreateVehicleInstance(vehicle) {
    return new VehicleInterface(vehicle.entity, vehicle.netId, vehicle.script, vehicle.plate, vehicle.model, vehicle.make, vehicle.id, vehicle.vin, vehicle.owner, vehicle.group);
}
export function GetVehicle(handle) {
    return typeof handle === 'string' ? GetVehicleFromVin(handle) : GetVehicleFromEntity(handle);
}
export function GetVehicleFromEntity(entityId) {
    return CreateVehicleInstance(exports.ox_core.GetVehicleFromEntity(entityId));
}
export function GetVehicleFromNetId(netId) {
    return CreateVehicleInstance(exports.ox_core.GetVehicleFromNetId(netId));
}
export function GetVehicleFromVin(vin) {
    return CreateVehicleInstance(exports.ox_core.GetVehicleFromVin(vin));
}
export function GetVehicles(filter) {
    const vehicles = exports.ox_core.GetVehicles(filter);
    for (const id in vehicles)
        vehicles[id] = CreateVehicleInstance(vehicles[id]);
    return vehicles;
}
export function GetVehicleFromFilter(filter) {
    return CreateVehicleInstance(exports.ox_core.GetVehicleFromFilter(filter));
}
export async function CreateVehicle(data, coords, heading) {
    return CreateVehicleInstance(await exports.ox_core.CreateVehicle(data, coords, heading));
}
export async function SpawnVehicle(dbId, coords, heading) {
    return CreateVehicleInstance(await exports.ox_core.SpawnVehicle(dbId, coords, heading));
}
