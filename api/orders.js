// api/orders.js
// Supabase version – no SQLite dependency

const { supabase } = require('../lib/supabase');
const { Resend } = require('resend');
const resend = new Resend('re_Yh2eBit5_B4trFa1cYnoKNFPGwHmBEK8C');

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
      const { data: product, error: prodErr } = await supabase.from('products').select('stock, name').eq('id', product_id).single();
      if (prodErr) throw prodErr;
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.stock <= 0) return res.status(400).json({ error: 'Insufficient stock' });
      // Fetch customer email and name
      const { data: customer, error: custErr } = await supabase.from('customers').select('full_name, email').eq('id', customer_id).single();
      if (custErr) throw custErr;
      
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

      // Send Email
      if (customer && customer.email) {
        try {
          const isTestMode = customer.email.includes('+test');
          const final_to_email = isTestMode ? customer.email.replace('+test', '') : customer.email;
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: final_to_email,
            subject: `Đơn hàng của bạn đã được ghi nhận rồi nè! Cảm ơn bạn nhé 👋`,
            html: `
              <p>Chào <strong>${customer.full_name}</strong>,</p>
              <p>Mình vừa nhận được thông tin đăng ký của bạn cho <strong>${product.name}</strong> với số tiền là <strong>${Number(amount).toLocaleString('vi-VN')}đ</strong>. Cảm ơn bạn rất nhiều vì đã tin tưởng và đồng hành cùng The Lifeskill Hub nha.</p>
              <p>Đơn giản thôi, để bắt đầu lộ trình của chúng ta, bạn vui lòng kiểm tra hộp thư email (và cả Zalo) trong vòng 24h tới nhé. Mình sẽ chủ động gửi hướng dẫn chi tiết và liên hệ để xếp lịch với bạn.</p>
              <p>Đừng lo lắng gì nghen!</p>
              <p>Mình yêu bạn,<br><strong>The Lifeskill Hub</strong></p>
            `
          });
        } catch (emailErr) {
          console.error("Order Email Error:", emailErr);
          // Non-blocking error
        }
      }

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
