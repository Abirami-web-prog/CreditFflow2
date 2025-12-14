import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "turntable.proxy.rlwy.net",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "XdjpIzuzwbyXwjPEMKXGTnWdkmozogjo",
  database: process.env.MYSQL_DATABASE || "railway",
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("✅ Database connected successfully!");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        INDEX idx_customer_id (customer_id),
        INDEX idx_date (date)
      )
    `);

    console.log("✅ Database tables initialized successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
    if (connection) connection.release();
    process.exit(1);
  }
}

initializeDatabase();

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

export default pool;
