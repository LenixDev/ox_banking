import { GetCharacterAccount } from './account';
class PlayerInterface {
    source;
    userId;
    charId;
    stateId;
    username;
    identifier;
    ped;
    state;
    constructor(source, userId, charId, stateId, username, identifier, ped) {
        this.source = source;
        this.userId = userId;
        this.charId = charId;
        this.stateId = stateId;
        this.username = username;
        this.identifier = identifier;
        this.ped = ped;
        this.source = source;
        this.userId = userId;
        this.charId = charId;
        this.stateId = stateId;
        this.username = username;
        this.identifier = identifier;
        this.ped = ped;
    }
    getCoords() {
        return GetEntityCoords(this.ped);
    }
    getState() {
        return Player(source).state;
    }
    async getAccount() {
        return this.charId ? GetCharacterAccount(this.charId) : null;
    }
}
Object.keys(exports.ox_core.GetPlayerCalls()).forEach((method) => {
    PlayerInterface.prototype[method] = function (...args) {
        return exports.ox_core.CallPlayer(this.source, method, ...args);
    };
});
PlayerInterface.prototype.toString = function () {
    return JSON.stringify(this, null, 2);
};
function CreatePlayerInstance(player) {
    if (!player)
        return;
    return new PlayerInterface(player.source, player.userId, player.charId, player.stateId, player.username, player.identifier, player.ped);
}
export function GetPlayer(playerId) {
    return CreatePlayerInstance(exports.ox_core.GetPlayer(playerId));
}
export function GetPlayerFromUserId(userId) {
    return CreatePlayerInstance(exports.ox_core.GetPlayerFromUserId(userId));
}
export function GetPlayerFromCharId(charId) {
    return CreatePlayerInstance(exports.ox_core.GetPlayerFromCharId(charId));
}
export function GetPlayers(filter) {
    const players = exports.ox_core.GetPlayers(filter);
    for (const id in players)
        players[id] = CreatePlayerInstance(players[id]);
    return players;
}
export function GetPlayerFromFilter(filter) {
    return CreatePlayerInstance(exports.ox_core.GetPlayerFromFilter(filter));
}
