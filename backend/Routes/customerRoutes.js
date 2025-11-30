// routes/customers.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET ALL CUSTOMERS
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching customers:", err.message);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET SINGLE CUSTOMER BY ID
router.get("/:id", async (req, res) => {
  const customerId = req.params.id;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE id = ?",
      [customerId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Customer not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching customer:", err.message);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// ADD NEW CUSTOMER
router.post("/", async (req, res) => {
  const { name, phone, address } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "Name & Phone are required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
      [name, phone, address]
    );
    res.json({ message: "Customer added", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding customer:", err.message);
    res.status(500).json({ error: "Failed to add customer" });
  }
});

// ADD TRANSACTION
router.post("/:id/transactions", async (req, res) => {
  const customerId = req.params.id;
  const { amount, type, date } = req.body;
  if (!amount || !type) return res.status(400).json({ error: "Amount & Type are required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO transactions (customer_id, amount, type, date) VALUES (?, ?, ?, ?)",
      [customerId, amount, type, date || new Date()]
    );
    res.json({ message: "Transaction added", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding transaction:", err.message);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

// DELETE CUSTOMER
router.delete("/:id", async (req, res) => {
  const customerId = req.params.id;
  try {
    await pool.query("DELETE FROM transactions WHERE customer_id = ?", [customerId]);
    await pool.query("DELETE FROM customers WHERE id = ?", [customerId]);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting customer:", err.message);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
