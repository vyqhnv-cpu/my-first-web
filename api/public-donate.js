// api/public-donate.js
// Serverless function for public donation using Supabase (CommonJS)

const { supabase } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { full_name, phone, email, amount, product_id } = req.body || {};
  if (!full_name || !phone || !amount || !product_id) {
    res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
    return;
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
          zalo: email ? `Email: ${email}` : null,
          registered_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (err) throw err;
      customer = newCust;
    }
    // Validate product stock
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
      .update({ stock: supabase.raw('stock - 1') })
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
    res.json({ success: true, order_id: order.id });
  } catch (e) {
    console.error('Donate error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
