import mysql from "mysql2/promise";

export class Database {
  readonly pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log("MySQL connection successful");
      connection.release();
    } catch (error) {
      console.error("MySQL connection failed:", error);
      console.error("Check that XAMPP MySQL is running, DB_NAME exists, and .env is configured.");
    }
  }
}

export const database = new Database();
export const pool = database.pool;
