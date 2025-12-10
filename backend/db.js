import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,          // Railway variable (NOT MYSQL_HOST)
  user: process.env.MYSQLUSER,          // Railway variable (NOT MYSQL_USER)
  password: process.env.MYSQLPASSWORD,  // Railway variable (NOT MYSQL_PASSWORD)
  database: process.env.MYSQLDATABASE,  // Railway variable (NOT MYSQL_DATABASE)
  port: process.env.MYSQLPORT || 3306,  // Railway gives MYSQLPORT
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test DB connection
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Database connected successfully!");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();

export default pool;
