import { Dict } from "@communityox/ox_core";

export interface TransferAccountBalance {
  toId: number;
  amount: number;
  overdraw?: boolean;
  message?: string;
  note?: string;
  actorId?: number;
}

export interface MySqlRow<T = string | number | boolean | Dict<any> | undefined> {
  [column: string]: T;
}

export interface OkPacket {
  affectedRows: number;
  insertId: number;
  warningStatus: any;
}