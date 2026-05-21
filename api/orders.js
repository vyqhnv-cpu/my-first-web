// api/orders.js
module.exports = (db) => {
  const router = require('express').Router();

  // GET all orders
  router.get('/', (req, res) => {
    db.all('SELECT * FROM orders', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET order by id
  router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    });
  });

  // POST create order (with stock decrement)
  router.post('/', (req, res) => {
    const { customer_id, product_id, amount, status } = req.body;
    const orderDate = new Date().toISOString();
    // Transaction: check stock, decrement, insert order
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.get('SELECT stock FROM products WHERE id = ?', [product_id], (err, product) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        if (!product) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Product not found' });
        }
        if (product.stock <= 0) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Insufficient stock' });
        }
        // Decrease stock
        db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [product_id], function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          // Insert order
          const stmt = db.prepare('INSERT INTO orders (customer_id, product_id, amount, status, order_date) VALUES (?,?,?,?,?)');
          stmt.run([customer_id, product_id, amount, status || "pending", orderDate], function (err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            db.run('COMMIT');
            res.json({ id: this.lastID });
          });
          stmt.finalize();
        });
      });
    });
  });

  // PUT update order
  router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { customer_id, product_id, amount, status } = req.body;
    const stmt = db.prepare('UPDATE orders SET customer_id = ?, product_id = ?, amount = ?, status = ? WHERE id = ?');
    stmt.run([customer_id, product_id, amount, status, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
    stmt.finalize();
  });

  // DELETE order
  router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM orders WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  });

  return router;
};
