import { GetCharacterAccount } from "..";

export class PlayerInterface {
  public state: StateBagInterface;

  constructor(
    public source: number,
    public userId: number,
    public charId: number | undefined,
    public stateId: string | undefined,
    public username: string,
    public identifier: string,
    public ped: number,
  ) {
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