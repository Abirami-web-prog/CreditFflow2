import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,          // Railway PUBLIC host (not internal)
  user: process.env.MYSQL_USER,          // Railway username (e.g., root)
  password: process.env.MYSQL_PASSWORD,  // Railway password
  database: process.env.MYSQL_DATABASE,  // Railway database
  port: process.env.MYSQL_PORT || 3306,  // Railway public port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
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
