// server.js (local development)
// Uses Supabase for all DB operations. Keeps the same routes as before.

const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const { supabase } = require('./lib/supabase');
const { Resend } = require('resend');

// Khởi tạo Resend
// Thay chữ 'API_KEY_CUA_BAN' bằng đoạn mã trong file resend_config.txt của bạn nhé
const resend = new Resend('re_Yh2eBit5_B4trFa1cYnoKNFPGwHmBEK8C');

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
// Helpers to calculate scheduled dates (in ISO format)
const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// API Tự động gửi chuỗi 3 email
app.post('/api/send-email', async (req, res) => {
  const { to_email, user_name, form_type } = req.body;
  
  if (!to_email) {
    return res.status(400).json({ error: 'Không có email' });
  }

  // Chế độ test: gửi ngay lập tức cả 3 email nếu email chứa '+test'
  const isTestMode = to_email.includes('+test');
  
  // Resend bản miễn phí chỉ cho phép gửi đúng email gốc, nên ta xóa chữ '+test' đi trước khi gửi
  const final_to_email = isTestMode ? to_email.replace('+test', '') : to_email;
  
  // Lên lịch thời gian (nếu không phải test mode)
  const scheduledTime2 = isTestMode ? undefined : addDays(2); // 48 giờ sau
  const scheduledTime3 = isTestMode ? undefined : addDays(3); // 72 giờ sau

  try {
    // === Email 1: Welcome (Gửi ngay) ===
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: final_to_email,
      subject: `Chào bạn, tui là The Lifeskill Hub đây! 👋`,
      html: `
        <p>Chào <strong>${user_name}</strong>,</p>
        <p>Tui vừa nhận được thông tin của bạn qua form <b>${form_type}</b> rồi nè. Cảm ơn bạn vì đã tin tưởng và chia sẻ những tâm tư của mình với tui nha.</p>
        <p>Tui biết ở tuổi này, giữa muôn vàn ngã rẽ sự nghiệp và cuộc sống, đôi khi mình thấy ngột ngạt và mông lung lắm. Bạn vất vả rồi! Nhưng không sao đâu, bạn thật đặc biệt theo cách của riêng mình, và tui lập ra The Lifeskill Hub là để tạo ra một góc nhỏ an toàn, nơi tụi mình có thể ngồi lại và gỡ rối cùng nhau.</p>
        <p>Mấy ngày tới, tui sẽ gửi cho bạn một vài câu chuyện nho nhỏ mà tui nghĩ sẽ giúp ích được cho bạn. Đừng áp lực gì nghen, chỉ là chút tâm tình tui muốn gửi gắm thôi.</p>
        <p>Tạm thời bạn cứ nghỉ ngơi đi nhé, bạn làm tốt lắm rồi!</p>
        <p>Mình yêu bạn,<br><strong>The Lifeskill Hub</strong></p>
      `
    });

    // === Email 2: Nurture (2 ngày sau) ===
    const email2Payload = {
      from: 'onboarding@resend.dev',
      to: final_to_email,
      subject: `Thật ra, mông lung không đáng sợ như bạn nghĩ đâu... 🤔`,
      html: `
        <p>Chào bạn lại là tui đây,</p>
        <p>Hôm nay bạn thấy thế nào? Tui muốn kể cho bạn nghe một sự thật: Hầu hết chúng ta đều sợ cảm giác "không biết mình muốn gì". Tui ngày xưa cũng vậy.</p>
        <p>Nhưng thật ra, mông lung lại là một tín hiệu siêu tốt. Nó báo hiệu rằng bạn không còn chấp nhận một cuộc sống đi theo khuôn mẫu cũ nữa. Bạn đang bắt đầu tìm kiếm một con đường thực sự thuộc về mình.</p>
        <p>Đơn giản thôi, khi bạn đi lạc, đó là lúc bạn có cơ hội khám phá ra một vùng đất mới. Bạn không cần phức tạp hóa lên hay tự trách bản thân đâu. Cứ cho phép mình hoang mang một chút, quan sát chính mình, và rồi bạn sẽ thấy manh mối đầu tiên xuất hiện.</p>
        <p>Thử xem sao nhé! Nhớ là dù có chuyện gì, cứ bước từng bước nhỏ thôi.</p>
        <p>Hẹn gặp bạn trong email ngày mai nha.</p>
        <p>Thương,<br><strong>The Lifeskill Hub</strong></p>
      `
    };
    if (scheduledTime2) email2Payload.scheduled_at = scheduledTime2;
    await resend.emails.send(email2Payload);

    // === Email 3: Sale (3 ngày sau) ===
    const email3Payload = {
      from: 'onboarding@resend.dev',
      to: final_to_email,
      subject: `Để tui đi cùng bạn đoạn đường này nhé! 🤝`,
      html: `
        <p>Chào bạn,</p>
        <p>Mấy hôm nay tụi mình nói chuyện nhiều về sự mông lung rồi. Hôm nay tui muốn đề xuất một giải pháp cụ thể hơn, để giúp bạn đi nhanh hơn và đỡ phải vấp lại những sai lầm mà tui từng trải qua.</p>
        <p>Ở The Lifeskill Hub, tui hoàn toàn không bán các khóa học lý thuyết khô khan. Tui chỉ có một đặc sản duy nhất: <strong>Khai vấn (Coaching) 1:1</strong>.</p>
        <p>Trong các buổi Khai vấn này, tụi mình sẽ ngồi lại trực tiếp với nhau. Tui không dạy đời hay chỉ đạo bạn phải làm thế này thế kia. Tui sẽ dùng những kinh nghiệm thực tế nhất để giúp bạn tự sắp xếp lại suy nghĩ, tìm ra thế mạnh thực sự của bản thân và lên một lộ trình rõ ràng cho sự nghiệp.</p>
        <p>Làm là sẽ được thôi, đừng lo!</p>
        <p>Nếu bạn cảm thấy đã sẵn sàng để tụi mình đồng hành cùng nhau, hãy đặt lịch Khai vấn 1:1 hoặc ủng hộ các gói Đồng hành tại đây nhé:<br>
        👉 <strong><a href="https://my-first-web.vercel.app/">Đăng ký Khai vấn 1:1 / Đóng góp tại đây</a></strong></p>
        <p>Tui rất mong chờ được lắng nghe trọn vẹn câu chuyện của bạn.</p>
        <p>Mình đợi bạn nhé,<br><strong>The Lifeskill Hub</strong></p>
      `
    };
    if (scheduledTime3) email3Payload.scheduled_at = scheduledTime3;
    await resend.emails.send(email3Payload);

    res.json({ success: true, message: isTestMode ? 'Đã gửi test 3 email ngay lập tức' : 'Đã lên lịch gửi 3 email' });
  } catch (error) {
    console.error('Send Email Error:', error);
    res.status(500).json({ error: error.message });
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
