import { Dict } from "@communityox/ox_core";

export interface MySqlRow<T = string | number | boolean | Dict<any> | undefined> {
  [column: string]: T;
}

export interface OkPacket {
  affectedRows: number;
  insertId: number;
  warningStatus: any;
}