// api/orders.js
// Supabase version – no SQLite dependency

const { supabase } = require('../lib/supabase');

module.exports = () => {
  const router = require('express').Router();

  // GET all orders
  router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET order by id
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  });

  // POST create order (with stock decrement)
  router.post('/', async (req, res) => {
    const { customer_id, product_id, amount, status } = req.body;
    const orderDate = new Date().toISOString();
    try {
      // Check stock
      const { data: product, error: prodErr } = await supabase.from('products').select('stock').eq('id', product_id).single();
      if (prodErr) throw prodErr;
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.stock <= 0) return res.status(400).json({ error: 'Insufficient stock' });
      // Decrease stock
      const { error: decErr } = await supabase.from('products').update({ stock: product.stock - 1 }).eq('id', product_id);
      if (decErr) throw decErr;
      // Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ customer_id, product_id, amount, status: status || 'pending', order_date: orderDate })
        .select('id')
        .single();
      if (orderErr) throw orderErr;
      res.json({ id: order.id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Server error' });
    }
  });

  // PUT update order
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { customer_id, product_id, amount, status } = req.body;
    const { error } = await supabase
      .from('orders')
      .update({ customer_id, product_id, amount, status })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // DELETE order
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  return router;
};
