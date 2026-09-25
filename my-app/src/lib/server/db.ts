import mysql, { type Pool } from "mysql2/promise";
import { readDbConfig } from "./serverEnv";
import { timing } from "./timing";

export class Database {
  private instance: Pool | undefined;

  /** Created on first use, so a missing setting is reported when a query needs it, with a clear message. */
  get pool() {
    this.instance ??= mysql.createPool({
      ...readDbConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    return this.instance;
  }
}

export const database = new Database();

/** Repositories hold this at import time, so it forwards to the real pool the first time it is touched. */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, property) {
    const real = database.pool;
    const value = Reflect.get(real, property, real);
    if (typeof value !== "function") return value;
    if (timing.enabled && (property === "query" || property === "execute")) {
      return (sql: unknown, ...args: unknown[]) =>
        timing.measure(`sql ${timing.describeSql(sql)}`, () => value.call(real, sql, ...args));
    }
    return value.bind(real);
  },
});
