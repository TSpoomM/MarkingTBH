import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  markingPool?: mysql.Pool;
  markingDatabase?: Database;
};

class Environment {
  static get(name: string, fallback?: string) {
    const value = process.env[name] ?? fallback;
    if (value === undefined) throw new Error(`Missing environment variable: ${name}`);
    return value;
  }
}

export class Database {
  readonly pool: mysql.Pool;

  constructor(pool?: mysql.Pool) {
    this.pool = pool ?? globalForDb.markingPool ?? mysql.createPool({
      host: Environment.get("DB_HOST", "127.0.0.1"),
      user: Environment.get("DB_USER", "root"),
      password: Environment.get("DB_PASSWORD", ""),
      database: Environment.get("DB_NAME"),
      port: Number(Environment.get("DB_PORT", "3306")),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      decimalNumbers: true,
    });
  }
}

export const database = globalForDb.markingDatabase ?? new Database();

if (process.env.NODE_ENV !== "production") {
  globalForDb.markingPool = database.pool;
  globalForDb.markingDatabase = database;
}
