// api/products.js
// Supabase version – no SQLite dependency

const { supabase } = require('../lib/supabase');

module.exports = () => {
  const router = require('express').Router();

  // GET all products
  router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET product by id
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  });

  // POST create product
  router.post('/', async (req, res) => {
    const { name, price, description, stock } = req.body;
    const { data, error } = await supabase
      .from('products')
      .insert({ name, price, description, stock: stock || 0 })
      .select('id')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  // PUT update product
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, description, stock } = req.body;
    const { error } = await supabase
      .from('products')
      .update({ name, price, description, stock })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // DELETE product
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  return router;
};
