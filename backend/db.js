import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,          // mysql.railway.internal
  user: process.env.MYSQL_USER,          // root
  password: process.env.MYSQL_PASSWORD,  // XdjpIzzwbyXwJPEMKXCTnWGkmezogjo
  database: process.env.MYSQL_DATABASE,  // railway
  port: process.env.MYSQL_PORT || 3306,  // 3306
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
pool.getConnection()
  .then(conn => {
    console.log("✅ Database connected successfully!");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

export default pool;
