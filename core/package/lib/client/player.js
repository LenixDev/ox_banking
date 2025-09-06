import { cache } from '@communityox/ox_lib/client';
class PlayerInterface {
    userId;
    charId;
    stateId;
    constructor() {
        try {
            const { userId, charId, stateId } = exports.ox_core.GetPlayer();
            this.userId = userId;
            this.charId = charId;
            this.stateId = stateId;
        }
        catch (e) { }
        this.state = LocalPlayer.state;
        this.constructor.prototype.toString = () => {
            return JSON.stringify(this, null, 2);
        };
        const getMethods = async () => {
            Object.keys(exports.ox_core.GetPlayerCalls()).forEach((method) => {
                if (!this.constructor.prototype[method])
                    this.constructor.prototype[method] = (...args) => exports.ox_core.CallPlayer(method, ...args);
            });
        };
        getMethods().catch(() => setImmediate(getMethods));
    }
    on(key, callback) {
        this.get(key);
        on(`ox:player:${key}`, (data) => {
            if (GetInvokingResource() == 'ox_core' && source === '')
                callback(data);
        });
    }
    get(key) {
        if (!this.charId)
            return;
        if (!(key in this)) {
            this[key] = exports.ox_core.CallPlayer('get', key) ?? null;
            this.on(key, (data) => (this[key] = data));
        }
        return this[key];
    }
    getCoords() {
        return GetEntityCoords(cache.ped);
    }
}
const player = new PlayerInterface();
export function GetPlayer() {
    return player;
}
on('ox:playerLoaded', (data) => {
    if (player.charId)
        return;
    for (const key in data)
        player[key] = data[key];
});
on('ox:playerLogout', () => {
    for (const key in player)
        delete player[key];
});
