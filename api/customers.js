// api/customers.js
// Supabase version – no SQLite dependency

const { supabase } = require('../lib/supabase');

export default () => {
  const router = require('express').Router();

  // GET all customers
  router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET customer by id
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  });

  // POST create customer
  router.post('/', async (req, res) => {
    const { full_name, phone, zalo, registered_at } = req.body;
    const { data, error } = await supabase
      .from('customers')
      .insert({
        full_name,
        phone,
        zalo,
        registered_at: registered_at || new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  // PUT update customer
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, zalo, registered_at } = req.body;
    const { error } = await supabase
      .from('customers')
      .update({ full_name, phone, zalo, registered_at })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // DELETE customer
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  return router;
};
