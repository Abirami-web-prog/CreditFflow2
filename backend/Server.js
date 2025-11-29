

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const db = require('./db');

app.use(cors());
app.use(express.json());

// Helper function to format date
const formatDate = (date) => {
  if (!date) return new Date().toISOString().slice(0, 10);
  if (typeof date === 'string') {
    return date.split('T')[0].split('Z')[0];
  }
  return new Date(date).toISOString().slice(0, 10);
};

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [customers] = await db.query(
      'SELECT id, name, mobile, place, outstanding_balance FROM Customers ORDER BY name'
    );

    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        try {
          const [transactions] = await db.query(
            'SELECT id AS transaction_id, DATE_FORMAT(date, "%Y-%m-%d") as date, type, amount, description FROM Transactions WHERE customer_id = ? ORDER BY date DESC',
            [customer.id]
          );
          return {
            ...customer,
            transactions: transactions || [],
          };
        } catch (err) {
          console.error(`Error fetching transactions for customer ${customer.id}:`, err.message);
          return { ...customer, transactions: [] };
        }
      })
    );

    res.json(enrichedCustomers);
  } catch (error) {
    console.error('Failed to fetch customers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST a new customer
app.post('/api/customers', async (req, res) => {
  const { name, mobile, place } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO Customers (name, mobile, place, outstanding_balance) VALUES (?, ?, ?, 0)',
      [name, mobile, place || null]
    );
    res.status(201).json({
      id: result.insertId,
      name,
      mobile,
      place: place || null,
      outstanding_balance: 0,
      transactions: [],
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mobile number already exists.' });
    }
    console.error('Failed to create customer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET customer details
app.get('/api/customers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [customers] = await db.query(
      'SELECT id, name, mobile, place, outstanding_balance FROM Customers WHERE id = ?',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const customer = customers[0];

    try {
      const [transactions] = await db.query(
        'SELECT id AS transaction_id, DATE_FORMAT(date, "%Y-%m-%d") as date, type, amount, description FROM Transactions WHERE customer_id = ? ORDER BY date DESC',
        [id]
      );
      res.json({ ...customer, transactions: transactions || [] });
    } catch (err) {
      console.error(`Error fetching transactions:`, err.message);
      res.json({ ...customer, transactions: [] });
    }
  } catch (error) {
    console.error('Failed to fetch customer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT update customer
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, mobile, place } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE Customers SET name = ?, mobile = ?, place = ? WHERE id = ?',
      [name, mobile, place || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    res.json({ message: 'Customer updated successfully.', id, name, mobile, place });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mobile number already exists.' });
    }
    console.error('Failed to update customer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE customer
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM Transactions WHERE customer_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM Customers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Customer not found.' });
    }

    await connection.commit();
    res.json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to delete customer:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// POST transaction
app.post('/api/customers/:id/transactions', async (req, res) => {
  const customerId = req.params.id;
  let { date, type, amount, description } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount are required.' });
  }

  // Format date properly - remove time component
  date = formatDate(date);

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [customers] = await connection.query('SELECT id FROM Customers WHERE id = ?', [customerId]);
    if (customers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Customer not found.' });
    }

    await connection.query(
      'INSERT INTO Transactions (customer_id, date, type, amount, description) VALUES (?, ?, ?, ?, ?)',
      [customerId, date, type, parsedAmount, description || null]
    );

    const updateAmount = type.toLowerCase() === 'credit' ? parsedAmount : -parsedAmount;
    await connection.query(
      'UPDATE Customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
      [updateAmount, customerId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Transaction added successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to add transaction:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// PUT update transaction
app.put('/api/customers/:customerId/transactions/:transactionId', async (req, res) => {
  const { customerId, transactionId } = req.params;
  let { date, type, amount, description } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount required.' });
  }

  // Format date properly - remove time component
  date = formatDate(date);

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT customer_id, type, amount FROM Transactions WHERE id = ?',
      [transactionId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const old = rows[0];
    if (String(old.customer_id) !== String(customerId)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Transaction does not belong to this customer.' });
    }

    await connection.query(
      'UPDATE Transactions SET date = ?, type = ?, amount = ?, description = ? WHERE id = ?',
      [date, type, parsedAmount, description || null, transactionId]
    );

    const oldSigned = old.type.toLowerCase() === 'credit' ? Number(old.amount) : -Number(old.amount);
    const newSigned = type.toLowerCase() === 'credit' ? parsedAmount : -parsedAmount;
    const delta = newSigned - oldSigned;

    if (delta !== 0) {
      await connection.query(
        'UPDATE Customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
        [delta, customerId]
      );
    }

    await connection.commit();
    res.json({ message: 'Transaction updated successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to update transaction:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE transaction
app.delete('/api/customers/:customerId/transactions/:transactionId', async (req, res) => {
  const { customerId, transactionId } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT customer_id, type, amount FROM Transactions WHERE id = ?',
      [transactionId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const t = rows[0];
    if (String(t.customer_id) !== String(customerId)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Transaction does not belong to this customer.' });
    }

    await connection.query('DELETE FROM Transactions WHERE id = ?', [transactionId]);

    const signed = t.type.toLowerCase() === 'credit' ? Number(t.amount) : -Number(t.amount);
    await connection.query(
      'UPDATE Customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?',
      [signed, customerId]
    );

    await connection.commit();
    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to delete transaction:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/', (req, res) => {
  res.send('✅ CreditFlow Backend is running!');
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

module.exports = app;








/*const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const db = require('./db');

app.use(cors());
app.use(express.json());

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [customers] = await db.query(
      'SELECT id, name, mobile, place, outstanding_balance FROM Customers ORDER BY name'
    );

    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        try {
          const [transactions] = await db.query(
            'SELECT id AS transaction_id, date, type, amount, description FROM Transactions WHERE customer_id = ? ORDER BY date DESC',
            [customer.id]
          );
          return {
            ...customer,
            transactions: transactions || [],
          };
        } catch (err) {
          console.error(`Error fetching transactions for customer ${customer.id}:`, err.message);
          return { ...customer, transactions: [] };
        }
      })
    );

    res.json(enrichedCustomers);
  } catch (error) {
    console.error('Failed to fetch customers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST a new customer
app.post('/api/customers', async (req, res) => {
  const { name, mobile, place } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO Customers (name, mobile, place, outstanding_balance) VALUES (?, ?, ?, 0)',
      [name, mobile, place || null]
    );
    res.status(201).json({
      id: result.insertId,
      name,
      mobile,
      place: place || null,
      outstanding_balance: 0,
      transactions: [],
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mobile number already exists.' });
    }
    console.error('Failed to create customer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET customer details
app.get('/api/customers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [customers] = await db.query(
      'SELECT id, name, mobile, place, outstanding_balance FROM Customers WHERE id = ?',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const customer = customers[0];

    try {
      const [transactions] = await db.query(
        'SELECT id AS transaction_id, date, type, amount, description FROM Transactions WHERE customer_id = ? ORDER BY date DESC',
        [id]
      );
      res.json({ ...customer, transactions: transactions || [] });
    } catch (err) {
      console.error(`Error fetching transactions:`, err.message);
      res.json({ ...customer, transactions: [] });
    }
  } catch (error) {
    console.error('Failed to fetch customer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT update customer
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, mobile, place } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE Customers SET name = ?, mobile = ?, place = ? WHERE id = ?',
      [name, mobile, place || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    res.json({ message: 'Customer updated successfully.', id, name, mobile, place });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mobile number already exists.' });
    }
    console.error('Failed to update customer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE customer
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM Transactions WHERE customer_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM Customers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Customer not found.' });
    }

    await connection.commit();
    res.json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to delete customer:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// POST transaction
app.post('/api/customers/:id/transactions', async (req, res) => {
  const customerId = req.params.id;
  const { type, amount, description } = req.body;
  const date = new Date().toISOString().slice(0, 10);

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount are required.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [customers] = await connection.query('SELECT id FROM Customers WHERE id = ?', [customerId]);
    if (customers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Customer not found.' });
    }

    await connection.query(
      'INSERT INTO Transactions (customer_id, date, type, amount, description) VALUES (?, ?, ?, ?, ?)',
      [customerId, date, type, parsedAmount, description || null]
    );

    const updateAmount = type.toLowerCase() === 'credit' ? parsedAmount : -parsedAmount;
    await connection.query(
      'UPDATE Customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
      [updateAmount, customerId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Transaction added successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to add transaction:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// PUT update transaction
app.put('/api/customers/:customerId/transactions/:transactionId', async (req, res) => {
  const { customerId, transactionId } = req.params;
  const { date, type, amount, description } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount required.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT customer_id, type, amount FROM Transactions WHERE id = ?',
      [transactionId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const old = rows[0];
    if (String(old.customer_id) !== String(customerId)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Transaction does not belong to this customer.' });
    }

    await connection.query(
      'UPDATE Transactions SET date = ?, type = ?, amount = ?, description = ? WHERE id = ?',
      [date || null, type, parsedAmount, description || null, transactionId]
    );

    const oldSigned = old.type.toLowerCase() === 'credit' ? Number(old.amount) : -Number(old.amount);
    const newSigned = type.toLowerCase() === 'credit' ? parsedAmount : -parsedAmount;
    const delta = newSigned - oldSigned;

    if (delta !== 0) {
      await connection.query(
        'UPDATE Customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
        [delta, customerId]
      );
    }

    await connection.commit();
    res.json({ message: 'Transaction updated successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to update transaction:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE transaction
app.delete('/api/customers/:customerId/transactions/:transactionId', async (req, res) => {
  const { customerId, transactionId } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT customer_id, type, amount FROM Transactions WHERE id = ?',
      [transactionId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const t = rows[0];
    if (String(t.customer_id) !== String(customerId)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Transaction does not belong to this customer.' });
    }

    await connection.query('DELETE FROM Transactions WHERE id = ?', [transactionId]);

    const signed = t.type.toLowerCase() === 'credit' ? Number(t.amount) : -Number(t.amount);
    await connection.query(
      'UPDATE Customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?',
      [signed, customerId]
    );

    await connection.commit();
    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to delete transaction:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/', (req, res) => {
  res.send('✅ CreditFlow2 Backend is running!');
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

*/
