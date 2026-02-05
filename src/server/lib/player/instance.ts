import { PlayerInterface } from "./interface";
import { OxPlayer } from "./class";

export function CreatePlayerInstance(player?: OxPlayer) {
  if (!player) return;

  return new PlayerInterface(
    player.source as number,
    player.userId,
    player.charId,
    player.stateId,
    player.username,
    player.identifier,
    player.ped,
  ) as OxPlayer & PlayerInterface;
}