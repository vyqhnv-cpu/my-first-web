// server.js (local development)
// Uses Supabase for all DB operations. Keeps the same routes as before.

const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const { supabase } = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Auth middleware
const authMiddleware = basicAuth({
  users: { admin: 'admin123' },
  challenge: true,
  realm: 'Admin Area',
});

app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RES] ${req.method} ${req.url} -> ${res.statusCode}`);
  });
  next();
});

// Public donate endpoint – same logic as api/public-donate.js but using supabase
app.post('/api/public-donate', async (req, res) => {
  const { full_name, phone, email, amount, product_id } = req.body || {};
  if (!full_name || !phone || !amount || !product_id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    // Find or create customer
    let { data: customer, error } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!customer) {
      const { data: newCust, error: err } = await supabase
        .from('customers')
        .insert({
          full_name,
          phone,
          email: email || null,
          zalo: null,
          registered_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (err) throw err;
      customer = newCust;
    }
    // Check product stock
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single();
    if (prodErr) throw prodErr;
    if (!product) return res.status(404).json({ error: 'Gói ủng hộ không tồn tại!' });
    if (product.stock <= 0) return res.status(400).json({ error: 'Hết hàng' });
    // Decrease stock
    const { error: decErr } = await supabase
      .from('products')
      .update({ stock: product.stock - 1 })
      .eq('id', product_id);
    if (decErr) throw decErr;
    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        product_id,
        amount,
        status: 'pending',
        order_date: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (orderErr) throw orderErr;
    return res.json({ success: true, order_id: order.id });
  } catch (e) {
    console.error('Donate error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

// Protect admin static folder
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));

// Load API routes (they use Supabase internally)
app.use('/api/products', require('./api/products')());
app.use('/api/customers', require('./api/customers')());
app.use('/api/orders', require('./api/orders')());
app.use('/api/transactions', require('./api/transactions'));

// Static assets
app.use('/asset', express.static(path.join(__dirname, 'asset')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/thank-you.html', (req, res) => res.sendFile(path.join(__dirname, 'thank-you.html')));
app.get('/waitlist.json', (req, res) => res.sendFile(path.join(__dirname, 'waitlist.json')));

// Home page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Fallback
app.get('*', (req, res) => res.redirect('/'));

// Start server only if run directly (local dev)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
