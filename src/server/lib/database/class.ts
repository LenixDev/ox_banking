import { PoolConnection, QueryOptions } from "mariadb/*";
import { MySqlRow, OkPacket } from "../types";
import { getScalar } from "./modules";

export { Connection }

class Connection {
  public transaction?: boolean;

  constructor(public connection: PoolConnection) {}

  async execute<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]) {
    return (await this.connection.execute(query, values)) as T;
  }

  async scalar<T>(query: string | QueryOptions, values?: any[]) {
    return getScalar(await this.execute<T[]>(query, values)) as T | null;
  }

  async update(query: string | QueryOptions, values?: any[]) {
    return (await this.execute<OkPacket>(query, values))?.affectedRows;
  }

  commit() {
    delete this.transaction;
    return this.connection.commit();
  }

  [Symbol.dispose]() {
    if (this.transaction) this.commit();
    this.connection.release();
  }
  beginTransaction() {
    this.transaction = true;
    return this.connection.beginTransaction();
  }
  rollback() {
    delete this.transaction;
    return this.connection.rollback();
  }
}