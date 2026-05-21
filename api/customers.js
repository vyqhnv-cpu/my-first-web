// api/customers.js
module.exports = (db) => {
  const router = require('express').Router();

  // GET all customers
  router.get('/', (req, res) => {
    db.all('SELECT * FROM customers', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET customer by id
  router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    });
  });

  // POST create customer
  router.post('/', (req, res) => {
    const { full_name, phone, zalo, registered_at } = req.body;
    const stmt = db.prepare('INSERT INTO customers (full_name, phone, zalo, registered_at) VALUES (?,?,?,?)');
    stmt.run([full_name, phone, zalo, registered_at || new Date().toISOString()], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
    stmt.finalize();
  });

  // PUT update customer
  router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { full_name, phone, zalo, registered_at } = req.body;
    const stmt = db.prepare('UPDATE customers SET full_name = ?, phone = ?, zalo = ?, registered_at = ? WHERE id = ?');
    stmt.run([full_name, phone, zalo, registered_at, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
    stmt.finalize();
  });

  // DELETE customer
  router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  });

  return router;
};
