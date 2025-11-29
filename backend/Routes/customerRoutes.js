

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all customers
router.get('/', (req, res) => {
    const sql = 'SELECT id, name, mobile, outstanding_balance FROM Customers ORDER BY name';
    pool.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST a new customer
router.post('/', (req, res) => {
    const { name, mobile, place } = req.body;
    if (!name || !mobile) {
        return res.status(400).json({ error: 'Name and mobile are required.' });
    }
    const sql = 'INSERT INTO Customers (name, mobile, place) VALUES (?, ?, ?)';
    pool.query(sql, [name, mobile, place], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A customer with this mobile number already exists.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, name, mobile, place });
    });
});

// DELETE a customer
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Customers WHERE id = ?';
    pool.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.json({ message: 'Customer deleted successfully.' });
    });
});

// GET customer details and transactions
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT C.id, C.name, C.mobile, C.place, C.outstanding_balance, T.id AS transaction_id, T.date, T.type, T.amount
        FROM Customers C
        LEFT JOIN Transactions T ON C.id = T.customer_id
        WHERE C.id = ?
        ORDER BY T.date DESC`;
    
    pool.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        
        const customer = {
            id: results[0].id,
            name: results[0].name,
            mobile: results[0].mobile,
            place: results[0].place,
            outstanding_balance: results[0].outstanding_balance,
            transactions: results.filter(r => r.transaction_id).map(r => ({
                id: r.transaction_id,
                date: r.date,
                type: r.type,
                amount: r.amount
            }))
        };
        res.json(customer);
    });
});

// POST a new transaction for a customer
router.post('/:id/transactions', (req, res) => {
    const customerId = req.params.id;
    const { type, amount } = req.body;
    const date = new Date().toISOString().slice(0, 10);

    if (!type || !amount) {
        return res.status(400).json({ error: 'Type and amount are required.' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error('Transaction start error:', err);
                return res.status(500).json({ error: 'Transaction start error' });
            }

            const sqlInsert = 'INSERT INTO Transactions (customer_id, date, type, amount) VALUES (?, ?, ?, ?)';
            connection.query(sqlInsert, [customerId, date, type, amount], (err, result) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        console.error('Transaction insert error:', err);
                        return res.status(500).json({ error: err.message });
                    });
                    return;
                }
                
                const updateAmount = (type.toLowerCase() === 'credit') ? amount : -amount;
                const sqlUpdate = 'UPDATE Customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?';
                connection.query(sqlUpdate, [updateAmount, customerId], (err, result) => {
                    if (err) {
                        connection.rollback(() => {
                            connection.release();
                            console.error('Balance update error:', err);
                            return res.status(500).json({ error: err.message });
                        });
                        return;
                    }
                    
                    connection.commit(err => {
                        if (err) {
                            connection.rollback(() => {
                                connection.release();
                                console.error('Transaction commit error:', err);
                                return res.status(500).json({ error: 'Transaction commit error' });
                            });
                            return;
                        }
                        connection.release();
                        res.status(201).json({ message: 'Transaction added and balance updated' });
                    });
                });
            });
        });
    });
});

// PUT to update a customer
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, mobile, place } = req.body;

    if (!name || !mobile || !place) {
        return res.status(400).json({ error: 'Name, mobile, and place are required.' });
    }

    const sql = 'UPDATE Customers SET name = ?, mobile = ?, place = ? WHERE id = ?';
    pool.query(sql, [name, mobile, place, id], (err, result) => {
        if (err) {
            console.error('Failed to update customer:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.json({ message: 'Customer updated successfully.', id, name, mobile, place });
    });
});

module.exports = router;


