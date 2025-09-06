export const Ox = exports.ox_core;
export function GetGroup(name) {
    return GlobalState[`group.${name}`];
}
