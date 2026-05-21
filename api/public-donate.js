// api/public-donate.js
// Vercel serverless function handling public donation requests
// This endpoint does NOT require authentication.
// It mirrors the logic previously in server.js's /api/public-donate route.

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Resolve DB path (same as server.js)
const dbPath = path.join(__dirname, '..', 'my-brain', 'brain.db');
const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error('Failed to open DB:', err);
});

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { full_name, phone, email, amount, product_id } = req.body || {};
  if (!full_name || !phone || !amount || !product_id) {
    res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
    return;
  }

  // Find or create customer then create order
  db.get('SELECT id FROM customers WHERE phone = ?', [phone], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const handleOrderCreation = customerId => {
      const orderDate = new Date().toISOString();
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.get('SELECT stock FROM products WHERE id = ?', [product_id], (err, product) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (!product) {
            db.run('ROLLBACK');
            res.status(404).json({ error: 'Gói ủng hộ không tồn tại!' });
            return;
          }
          // Decrease stock
          db.run('UPDATE products SET stock = MAX(0, stock - 1) WHERE id = ?', [product_id], err => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            const stmt = db.prepare('INSERT INTO orders (customer_id, product_id, amount, status, order_date) VALUES (?,?,?,?,?)');
            stmt.run([customerId, product_id, amount, 'pending', orderDate], function (err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              db.run('COMMIT');
              res.json({ success: true, order_id: this.lastID });
            });
            stmt.finalize();
          });
        });
      });
    };

    if (row) {
      handleOrderCreation(row.id);
    } else {
      const registeredAt = new Date().toISOString();
      const stmt = db.prepare('INSERT INTO customers (full_name, phone, zalo, registered_at) VALUES (?,?,?,?)');
      stmt.run([full_name, phone, email ? `Email: ${email}` : '', registeredAt], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        handleOrderCreation(this.lastID);
      });
      stmt.finalize();
    }
  });
};
