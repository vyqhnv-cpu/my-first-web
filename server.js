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

// Protect API and Admin routes with Basic Auth
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));
app.use('/api', authMiddleware);

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

