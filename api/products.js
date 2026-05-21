// api/products.js
module.exports = (db) => {
  const router = require('express').Router();

  // GET all products
  router.get('/', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET product by id
  router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    });
  });

  // POST create product
  router.post('/', (req, res) => {
    const { name, price, description, stock } = req.body;
    const stmt = db.prepare('INSERT INTO products (name, price, description, stock) VALUES (?,?,?,?)');
    stmt.run([name, price, description, stock || 0], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
    stmt.finalize();
  });

  // PUT update product
  router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { name, price, description, stock } = req.body;
    const stmt = db.prepare('UPDATE products SET name = ?, price = ?, description = ?, stock = ? WHERE id = ?');
    stmt.run([name, price, description, stock, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
    stmt.finalize();
  });

  // DELETE product
  router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  });

  return router;
};
