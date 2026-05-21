// server.js
const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Auth middleware
const authMiddleware = basicAuth({
  users: { 'admin': 'admin123' },
  challenge: true,
  realm: 'Admin Area'
});

app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RES] ${req.method} ${req.url} -> ${res.statusCode}`);
  });
  next();
});

// SQLite DB path
const dbPath = path.join(__dirname, 'my-brain', 'brain.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open DB:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Browser log catcher endpoint
app.post('/log', (req, res) => {
  console.log('[BROWSER CLIENT LOG]', req.body);
  res.sendStatus(200);
});

// Public endpoint for submitting a donation request
app.post('/api/public-donate', (req, res) => {
  const { full_name, phone, email, amount, product_id } = req.body;
  if (!full_name || !phone || !amount || !product_id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }

  // Find or create customer
  db.get('SELECT id FROM customers WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const handleOrderCreation = (customerId) => {
      const orderDate = new Date().toISOString();
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.get('SELECT stock FROM products WHERE id = ?', [product_id], (err, product) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          if (!product) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Gói ủng hộ không tồn tại!' });
          }

          // Decrease stock
          db.run('UPDATE products SET stock = MAX(0, stock - 1) WHERE id = ?', [product_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            // Insert order
            const stmt = db.prepare('INSERT INTO orders (customer_id, product_id, amount, status, order_date) VALUES (?,?,?,?,?)');
            stmt.run([customerId, product_id, amount, 'pending', orderDate], function (err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
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
          return res.status(500).json({ error: err.message });
        }
        handleOrderCreation(this.lastID);
      });
      stmt.finalize();
    }
  });
});

// Protect API and Admin routes with Basic Auth
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));
// app.use('/api', authMiddleware); // Disabled auth for public API endpoints

// Load API routes
app.use('/api/products', require('./api/products')(db));
app.use('/api/customers', require('./api/customers')(db));
app.use('/api/orders', require('./api/orders')(db));

// Public routes for the landing page
app.use('/asset', express.static(path.join(__dirname, 'asset')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/thank-you.html', (req, res) => res.sendFile(path.join(__dirname, 'thank-you.html')));
app.get('/waitlist.json', (req, res) => res.sendFile(path.join(__dirname, 'waitlist.json')));

// Main homepage route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback redirect to home for unmatched routes
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

