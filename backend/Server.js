import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS allow all (you can restrict later)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ---------------------------
//        ROUTES
// ---------------------------

// GET all customers and related transactions
app.get("/customers", async (req, res) => {
  try {
    const [customers] = await pool.query("SELECT * FROM customers");

    if (!customers.length) {
      return res.status(200).json([]);
    }

    const ids = customers.map((c) => c.id);

    const [transactions] = await pool.query(
      "SELECT * FROM transactions WHERE customer_id IN (?)",
      [ids]
    );

    const txMap = {};
    for (const tx of transactions) {
      (txMap[tx.customer_id] ||= []).push(tx);
    }

    const result = customers.map((c) => ({
      ...c,
      transactions: txMap[c.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /customers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE new customer
app.post("/customers", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Missing name" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
      [name, email || null, phone || null]
    );

    res.status(201).json({ message: "Customer added", id: result.insertId });
  } catch (err) {
    console.error("POST /customers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADD transaction
app.post("/transactions", async (req, res) => {
  const { customer_id, description, amount, status, date } = req.body;

  if (!customer_id || amount == null) {
    return res
      .status(400)
      .json({ error: "Missing customer_id or amount" });
  }

  try {
    await pool.execute(
      "INSERT INTO transactions (customer_id, description, amount, status, date) VALUES (?, ?, ?, ?, ?)",
      [customer_id, description || null, amount, status || null, date || null]
    );

    res.status(201).json({ message: "Transaction added" });
  } catch (err) {
    console.error("POST /transactions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE transaction
app.delete("/transactions/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM transactions WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("DELETE /transactions/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE customer + transactions (transaction)
app.delete("/customers/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute("DELETE FROM transactions WHERE customer_id = ?", [
      req.params.id,
    ]);

    const [result] = await conn.execute(
      "DELETE FROM customers WHERE id = ?",
      [req.params.id]
    );

    await conn.commit();

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer and related transactions deleted" });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE /customers/:id error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// ---------------------------
//        START SERVER
// ---------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
