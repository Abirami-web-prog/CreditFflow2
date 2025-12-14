import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END), 0) as balance
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id
      GROUP BY c.id, c.name, c.phone, c.address, c.created_at, c.updated_at
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching customers:", err.message);
    res.status(500).json({ 
      error: "Failed to fetch customers",
      details: err.message 
    });
  }
});

router.get("/:id", async (req, res) => {
  const customerId = req.params.id;
  
  if (isNaN(customerId)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }
  
  try {
    const [customerRows] = await pool.query(
      "SELECT * FROM customers WHERE id = ?",
      [customerId]
    );
    
    if (customerRows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    const [transactions] = await pool.query(
      "SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC",
      [customerId]
    );
    
    const balance = transactions.reduce((acc, t) => {
      return acc + (t.type === 'credit' ? parseFloat(t.amount) : -parseFloat(t.amount));
    }, 0);
    
    res.json({
      ...customerRows[0],
      balance: parseFloat(balance.toFixed(2)),
      transactions
    });
  } catch (err) {
    console.error("❌ Error fetching customer:", err.message);
    res.status(500).json({ 
      error: "Failed to fetch customer",
      details: err.message 
    });
  }
});

router.post("/", async (req, res) => {
  const { name, phone, address } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: "Name & Phone are required" });
  }
  
  const cleanPhone = phone.toString().trim();
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
      [name.trim(), cleanPhone, address?.trim() || null]
    );
    
    res.status(201).json({ 
      message: "Customer added successfully", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("❌ Error adding customer:", err.message);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Phone number already exists" });
    }
    
    res.status(500).json({ 
      error: "Failed to add customer",
      details: err.message 
    });
  }
});

router.put("/:id", async (req, res) => {
  const customerId = req.params.id;
  const { name, phone, address } = req.body;
  
  if (isNaN(customerId)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }
  
  if (!name || !phone) {
    return res.status(400).json({ error: "Name & Phone are required" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?",
      [name.trim(), phone.toString().trim(), address?.trim() || null, customerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("❌ Error updating customer:", err.message);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Phone number already exists" });
    }
    
    res.status(500).json({ 
      error: "Failed to update customer",
      details: err.message 
    });
  }
});

router.post("/:id/transactions", async (req, res) => {
  const customerId = req.params.id;
  const { amount, type, date, description } = req.body;
  
  if (isNaN(customerId)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }
  
  if (!amount || !type) {
    return res.status(400).json({ error: "Amount & Type are required" });
  }
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }
  
  if (!['credit', 'debit'].includes(type)) {
    return res.status(400).json({ error: "Type must be 'credit' or 'debit'" });
  }

  try {
    const [customerCheck] = await pool.query(
      "SELECT id FROM customers WHERE id = ?",
      [customerId]
    );
    
    if (customerCheck.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    const transactionDate = date ? new Date(date) : new Date();
    
    const [result] = await pool.query(
      "INSERT INTO transactions (customer_id, amount, type, date, description) VALUES (?, ?, ?, ?, ?)",
      [customerId, parsedAmount, type, transactionDate, description || null]
    );
    
    res.status(201).json({ 
      message: "Transaction added successfully", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("❌ Error adding transaction:", err.message);
    res.status(500).json({ 
      error: "Failed to add transaction",
      details: err.message 
    });
  }
});

router.get("/:id/transactions", async (req, res) => {
  const customerId = req.params.id;
  
  if (isNaN(customerId)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC",
      [customerId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err.message);
    res.status(500).json({ 
      error: "Failed to fetch transactions",
      details: err.message 
    });
  }
});

router.delete("/:customerId/transactions/:transactionId", async (req, res) => {
  const { customerId, transactionId } = req.params;
  
  if (isNaN(customerId) || isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  
  try {
    const [result] = await pool.query(
      "DELETE FROM transactions WHERE id = ? AND customer_id = ?",
      [transactionId, customerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting transaction:", err.message);
    res.status(500).json({ 
      error: "Failed to delete transaction",
      details: err.message 
    });
  }
});

router.delete("/:id", async (req, res) => {
  const customerId = req.params.id;
  
  if (isNaN(customerId)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    await connection.query(
      "DELETE FROM transactions WHERE customer_id = ?", 
      [customerId]
    );
    
    const [result] = await connection.query(
      "DELETE FROM customers WHERE id = ?", 
      [customerId]
    );
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Customer not found" });
    }
    
    await connection.commit();
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error deleting customer:", err.message);
    res.status(500).json({ 
      error: "Failed to delete customer",
      details: err.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
