import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  markingPool?: mysql.Pool;
};

function env(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const db =
  globalForDb.markingPool ??
  mysql.createPool({
    host: env("DB_HOST", "127.0.0.1"),
    user: env("DB_USER", "root"),
    password: env("DB_PASSWORD", ""),
    database: env("DB_NAME"),
    port: Number(env("DB_PORT", "3306")),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    decimalNumbers: true,
  });

if (process.env.NODE_ENV !== "production") globalForDb.markingPool = db;
