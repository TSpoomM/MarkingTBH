// db.js
// Create "connection pool" to connect MySQL from XAMPP
// Use pool instead connect each time cuz faster and support multiple request 

import mysql from "mysql2/promise";


// const mysql = require('mysql2/promise');
// require('dotenv').config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection when start the seerver
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ connection MySQL (XAMPP) successful');
    connection.release();
  } catch (err) {
    console.error('❌ connection MySQL failed:', err);
    console.error('   check that: 1) XAMPP MySQL is running 2) DB_NAME exists 3) .env is configured correctly');
  }
}

// module.exports = { pool, testConnection };
