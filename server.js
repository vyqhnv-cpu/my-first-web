// server.js (local development)
// Uses Supabase for all DB operations. Keeps the same routes as before.

require('dotenv').config();

const express = require('express');
global.WebSocket = require('ws');
const basicAuth = require('express-basic-auth');
const path = require('path');
const { supabase } = require('./lib/supabase');
const { Resend } = require('resend');

// Khởi tạo Resend bằng biến môi trường
const resendApiKey = process.env.RESEND_API_KEY || 'MISSING_API_KEY';
const resend = new Resend(resendApiKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Auth middleware
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASSWORD || 'change_me_in_env_file';
const authUsers = {};
authUsers[adminUser] = adminPass;

const authMiddleware = basicAuth({
  users: authUsers,
  challenge: true,
  realm: 'Admin Area',
});

// Load MCP routes (async setup) BEFORE express.json() to prevent stream consumption
const mcpWrapper = express.Router();
app.use('/api/mcp', mcpWrapper);
const { setupMcpRouter } = require('./mcp/mcp_server');
setupMcpRouter(express).then(mcpRouter => {
  mcpWrapper.use(mcpRouter);
  console.log('[MCP] Routes mounted at /api/mcp');
}).catch(err => {
  console.error("[MCP] Failed to setup routes:", err);
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
      .select('stock, name')
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

    // Automated order confirmation email disabled due to security/confidentiality reasons

    return res.json({ success: true, order_id: order.id });
  } catch (e) {
    console.error('Donate error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});
// Helpers to calculate scheduled dates (in ISO format)
const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// API Tự động gửi chuỗi 3 email (Disabled due to business model change)
app.post('/api/send-email', async (req, res) => {
  // Return success without sending emails to keep client-side flow working smoothly
  res.json({ success: true, message: 'Chuỗi email nuôi dưỡng đã tắt.' });
});
// Protect admin static folder
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));

// ATTACHMENT TEST ENDPOINTS (SQLite)
const crypto = require('crypto');
const { runAsync, queryAsync, getAsync } = require('./lib/db');
const interviewsDb = require('./lib/interviews_db');

function generateLinkCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = 'GB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return result;
}

app.post('/api/attachment-test/submit', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.age || data.age < 18 || data.age > 30) return res.status(400).json({ error: 'Tuổi không hợp lệ' });
    if (data.district === 'Ngoài TP.HCM') return res.status(400).json({ error: 'Ngoài TP.HCM' });
    if (!data.answers || Object.keys(data.answers).length < 24) return res.status(400).json({ error: 'Thiếu câu trả lời' });

    for (let i = 1; i <= 24; i++) {
      const val = parseInt(data.answers[i]);
      if (isNaN(val) || val < 1 || val > 7) return res.status(400).json({ error: 'Đáp án không hợp lệ' });
    }

    const reversedIds = [4, 7, 10, 15, 18, 22];
    const anxietyIds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
    const avoidanceIds = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    
    let anxietySum = 0;
    let avoidanceSum = 0;
    
    for (let i = 1; i <= 24; i++) {
      let val = parseInt(data.answers[i]);
      if (reversedIds.includes(i)) val = 8 - val;
      if (anxietyIds.includes(i)) anxietySum += val;
      if (avoidanceIds.includes(i)) avoidanceSum += val;
    }
    
    const anxietyScore = anxietySum / 12;
    const avoidanceScore = avoidanceSum / 12;
    const CUTOFF = 4.0;
    
    let style = "";
    if(anxietyScore < CUTOFF && avoidanceScore < CUTOFF) style = "An toàn";
    else if(anxietyScore >= CUTOFF && avoidanceScore < CUTOFF) style = "Lo âu – bận tâm";
    else if(anxietyScore < CUTOFF && avoidanceScore >= CUTOFF) style = "Xa cách – né tránh";
    else style = "Sợ hãi – né tránh";

    const response_id = crypto.randomUUID();
    const submitted_at = new Date().toISOString();
    
    let link_code = null;
    let isUnique = false;
    while (!isUnique) {
      link_code = generateLinkCode();
      const row = await getAsync('SELECT link_code FROM attachment_responses WHERE link_code = ?', [link_code]);
      if (!row) isUnique = true;
    }
    
    await runAsync(`
      INSERT INTO attachment_responses (
        response_id, submitted_at, version, duration_seconds, age, gender, district, years_in_hcmc, 
        occupation, living_with, relationship_status, num_relationships, 
        q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, 
        q13, q14, q15, q16, q17, q18, q19, q20, q21, q22, q23, q24, 
        anxiety_score, avoidance_score, style, link_code
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?
      )
    `, [
      response_id, submitted_at, data.version || "v1-pilot", data.duration_seconds || 0,
      data.age, data.gender || "", data.district || "", data.years_in_hcmc || "",
      data.occupation || "", data.living_with || "", data.relationship_status || "", data.num_relationships || "",
      data.answers[1], data.answers[2], data.answers[3], data.answers[4], data.answers[5], data.answers[6],
      data.answers[7], data.answers[8], data.answers[9], data.answers[10], data.answers[11], data.answers[12],
      data.answers[13], data.answers[14], data.answers[15], data.answers[16], data.answers[17], data.answers[18],
      data.answers[19], data.answers[20], data.answers[21], data.answers[22], data.answers[23], data.answers[24],
      anxietyScore, avoidanceScore, style, link_code
    ]);

    res.json({ success: true, link_code });
  } catch (err) {
    console.error('Attachment Submit Error:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/admin/export-attachment', authMiddleware, async (req, res) => {
  try {
    const rows = await queryAsync('SELECT * FROM attachment_responses');
    if (!rows || rows.length === 0) return res.send('Chưa có dữ liệu nào.');
    
    // Loai bo link_code khoi CSV an danh
    const fields = Object.keys(rows[0]).filter(f => f !== 'link_code');
    const csvRows = [];
    csvRows.push(fields.join(',')); 
    for (const row of rows) {
      const values = fields.map(field => {
        let val = row[field];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
        return val;
      });
      csvRows.push(values.join(','));
    }
    const csvData = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=attachment_responses.csv');
    res.write('\ufeff');
    res.end(csvData);
  } catch (err) {
    res.status(500).send('Lỗi xuất dữ liệu.');
  }
});

// THONG TIN DANG KY PHONG VAN (Kho cach ly)
const attemptCache = new Map();

app.post('/api/interviews/submit', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    let userAttempts = attemptCache.get(ip) || { count: 0, firstAttempt: now };
    
    // Chong do ma (max 5/15m)
    if (now - userAttempts.firstAttempt > 15 * 60 * 1000) {
      userAttempts = { count: 0, firstAttempt: now };
    }
    if (userAttempts.count >= 5) {
      return res.status(429).json({ error: 'Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau 15 phút.' });
    }

    const { nickname, contact_method, contact_value, preferred_format, availability, consent_contact, consent_link_results, link_code } = req.body;
    
    if (!nickname || !contact_method || !contact_value || !preferred_format || !consent_contact) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    let finalLinkCode = '';
    if (consent_link_results && link_code) {
      const row = await getAsync('SELECT response_id FROM attachment_responses WHERE link_code = ?', [link_code.trim()]);
      if (!row) {
        userAttempts.count++;
        attemptCache.set(ip, userAttempts);
        return res.status(400).json({ error: 'Mã chưa đúng, bạn kiểm tra lại hoặc để trống' });
      }
      finalLinkCode = link_code.trim();
    }

    // Check trung lap contact_value trong 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const dup = await interviewsDb.getAsync('SELECT registration_id FROM interview_registrations WHERE contact_value = ? AND submitted_at > ?', [contact_value, yesterday]);
    if (dup) {
      return res.status(400).json({ error: 'Thông tin liên hệ này đã được đăng ký gần đây.' });
    }

    const reg_id = crypto.randomUUID();
    await interviewsDb.runAsync(`
      INSERT INTO interview_registrations (
        registration_id, submitted_at, nickname, contact_method, contact_value, 
        preferred_format, availability, consent_contact, consent_link_results, link_code, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reg_id, new Date().toISOString(), nickname, contact_method, contact_value, 
      preferred_format, JSON.stringify(availability || []), consent_contact ? 1 : 0, 
      consent_link_results ? 1 : 0, finalLinkCode, 'moi'
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Interview Submit Error:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Admin API
app.get('/admin/api/interviews', authMiddleware, async (req, res) => {
  try {
    const rows = await interviewsDb.queryAsync('SELECT * FROM interview_registrations ORDER BY submitted_at DESC');
    for (const row of rows) {
      if (row.link_code) {
        const testRow = await getAsync('SELECT age, anxiety_score, avoidance_score, style FROM attachment_responses WHERE link_code = ?', [row.link_code]);
        if (testRow) {
          row.test_data = testRow;
        }
      }
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn' });
  }
});

app.post('/admin/api/interviews/update', authMiddleware, async (req, res) => {
  try {
    const { registration_id, status, notes } = req.body;
    await interviewsDb.runAsync('UPDATE interview_registrations SET status = ?, notes = ? WHERE registration_id = ?', [status, notes, registration_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật' });
  }
});

app.post('/admin/api/interviews/delete', authMiddleware, async (req, res) => {
  try {
    const { registration_id } = req.body;
    await interviewsDb.runAsync('DELETE FROM interview_registrations WHERE registration_id = ?', [registration_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa' });
  }
});

app.post('/admin/api/interviews/delete_test', authMiddleware, async (req, res) => {
  try {
    const { link_code } = req.body;
    await runAsync('DELETE FROM attachment_responses WHERE link_code = ?', [link_code]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa test' });
  }
});

app.get('/admin/export-interviews', authMiddleware, async (req, res) => {
  try {
    const rows = await interviewsDb.queryAsync('SELECT * FROM interview_registrations');
    if (!rows || rows.length === 0) return res.send('Chưa có dữ liệu nào.');
    const fields = Object.keys(rows[0]);
    const csvRows = [];
    csvRows.push(fields.join(',')); 
    for (const row of rows) {
      const values = fields.map(field => {
        let val = row[field];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
        return val;
      });
      csvRows.push(values.join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=interview_registrations.csv');
    res.write('\ufeff');
    res.end(csvRows.join('\n'));
  } catch (err) {
    res.status(500).send('Lỗi xuất dữ liệu.');
  }
});

// Load API routes (they use Supabase internally)
app.use('/api/products', require('./api/products')());
app.use('/api/customers', require('./api/customers')());
app.use('/api/orders', require('./api/orders')());
app.use('/api/transactions', require('./api/transactions'));
app.use('/api/courses', require('./api/courses')());
app.use('/api/tests', require('./api/tests')());
app.use('/api/fb', require('./api/fb_tracking')());

// Blog JSON API endpoint
app.get('/api/posts', (req, res) => {
  const fs = require('fs');
  const postsPath = path.join(__dirname, 'public', 'data', 'posts.json');
  fs.readFile(postsPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Read posts error:", err);
      return res.status(500).json({ error: 'Failed to read posts' });
    }
    try {
      return res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error("Parse posts error:", parseErr);
      return res.status(500).json({ error: 'Invalid posts data' });
    }
  });
});

// Talkshows JSON API endpoint (Queries Supabase with local JSON fallback & merge)
app.post('/api/talkshows', (req, res) => res.redirect('/api/talkshows')); // redirect POST if any
  let talkshowsCache = null;
  const talkshowsPath = path.join(__dirname, 'public', 'data', 'talkshows.json');

  app.get('/api/talkshows', (req, res) => {
    const fetchFreshData = async () => {
      const fs = require('fs');
      try {
        let localTalkshows = [];
        if (fs.existsSync(talkshowsPath)) {
          localTalkshows = JSON.parse(fs.readFileSync(talkshowsPath, 'utf8'));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const { data, error } = await supabase
          .from('talkshows')
          .select('*')
          .order('id', { ascending: true })
          .abortSignal(controller.signal);
          
        clearTimeout(timeoutId);

        if (error || !data || data.length === 0) {
          talkshowsCache = localTalkshows;
          return;
        }

        const formattedDb = data.map(item => ({
          ...item,
          price: Number(item.price),
          original_price: item.original_price ? Number(item.original_price) : null
        }));

        const dbIds = new Set(formattedDb.map(t => t.id));
        const extraLocal = localTalkshows.filter(t => !dbIds.has(t.id));
        const merged = [...extraLocal, ...formattedDb];

        talkshowsCache = merged.sort((a, b) => a.id - b.id);
      } catch (err) {
        if (!talkshowsCache && fs.existsSync(talkshowsPath)) {
           talkshowsCache = JSON.parse(fs.readFileSync(talkshowsPath, 'utf8'));
        }
      }
    };

    if (talkshowsCache) {
      res.json(talkshowsCache);
      fetchFreshData();
    } else {
      const fs = require('fs');
      if (fs.existsSync(talkshowsPath)) {
        const localData = JSON.parse(fs.readFileSync(talkshowsPath, 'utf8'));
        res.json(localData);
      } else {
        res.json([]);
      }
      fetchFreshData();
    }
  });

// GET: Lấy chi tiết 1 talkshow (Queries Supabase with local JSON fallback)
app.get('/api/talkshows/:id', async (req, res) => {
  const fs = require('fs');
  const id = parseInt(req.params.id);
  const talkshowsPath = path.join(__dirname, 'public', 'data', 'talkshows.json');
  
  const sendFallback = () => {
    fs.readFile(talkshowsPath, 'utf8', (err, fileData) => {
      if (err) {
        console.error("Read talkshow detail fallback error:", err);
        return res.status(500).json({ error: 'Failed to read talkshow detail' });
      }
      try {
        const talkshows = JSON.parse(fileData);
        const talk = talkshows.find(t => t.id === id);
        if (talk) return res.json(talk);
        return res.status(404).json({ error: 'Không tìm thấy talkshow' });
      } catch (parseErr) {
        return res.status(500).json({ error: 'Invalid fallback data' });
      }
    });
  };

  try {
    const { data, error } = await supabase
      .from('talkshows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn(`Supabase talkshow detail query failed for ID ${id}, falling back:`, error.message);
      return sendFallback();
    }
    
    if (data) {
      return res.json({
        ...data,
        price: Number(data.price),
        original_price: data.original_price ? Number(data.original_price) : null
      });
    }
    
    return sendFallback();
  } catch (err) {
    console.error("Talkshow detail exception, falling back:", err);
    return sendFallback();
  }
});

// POST: Đăng ký tham gia Talkshow (Saves to talkshow_enrollments on Supabase)
app.post('/api/talkshows/register', async (req, res) => {
  const { talkshow_id, full_name, email, phone, age, selected_date, expectation } = req.body;
  
  let registration_id = 'mock_reg_id_fallback';
  
  try {
    const { data, error } = await supabase
      .from('talkshow_enrollments')
      .insert({
        talkshow_id,
        full_name,
        email,
        phone,
        age: age ? parseInt(age) : null,
        selected_date,
        expectation,
        registered_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error && error.code !== '42P01') {
      console.error("Supabase insert error for talkshow registration:", error.message);
      return res.status(500).json({ error: error.message });
    }
    if (data) {
      registration_id = data.id;
    }
  } catch (err) {
    console.warn("Supabase not fully configured or talkshow_enrollments table missing, skipping DB insert");
  }

  // Automated email disabled due to security/confidentiality reasons

  return res.json({ success: true, registration_id });
});

// Explicit clean URLs for main pages
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});
app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});
app.get('/talkshow', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'talkshow.html'));
});
app.get('/tests', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tests.html'));
});

// Khoa hoc detail routing
app.get('/khoa-hoc/:slug', (req, res) => {
  const cleanSlug = req.params.slug.replace(/\.html$/, '');
  const staticPath = path.join(__dirname, 'public', 'khoa-hoc', `${cleanSlug}.html`);
  const fs = require('fs');
  if (fs.existsSync(staticPath)) {
    return res.sendFile(staticPath);
  }
  return res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});

// Dynamic Blog Post SSR Routing (Lightweight Hydration + Static Pre-rendered Check)
app.get('/phong-cach-gan-bo-la-gi', (req, res) => res.redirect(301, '/blog/phong-cach-gan-bo-la-gi'));
app.get('/blog/:slug', (req, res) => {
  const fs = require('fs');
  const slug = req.params.slug.replace(/\.html$/, '');
  
  // 1. First priority: Check pre-rendered static HTML file in public/blog/
  const staticBlogPath = path.join(__dirname, 'public', 'blog', `${slug}.html`);
  if (fs.existsSync(staticBlogPath)) {
    return res.sendFile(staticBlogPath);
  }

  // 2. Second priority: Dynamic SSR hydration from posts.json
  const postsPath = path.join(__dirname, 'public', 'data', 'posts.json');
  const templatePath = path.join(__dirname, 'public', 'blog-post-template.html');

  fs.readFile(postsPath, 'utf8', (err, postsData) => {
    if (err) {
      console.error("Read posts error:", err);
      return res.sendFile(path.join(__dirname, 'public', 'blog.html'));
    }
    
    try {
      const posts = JSON.parse(postsData);
      const post = posts.find(p => p.slug === slug);
      
      if (!post) {
        // Post not found -> show main blog listing
        return res.sendFile(path.join(__dirname, 'public', 'blog.html'));
      }

      fs.readFile(templatePath, 'utf8', (err, templateData) => {
        if (err) {
          console.error("Read template error:", err);
          return res.sendFile(path.join(__dirname, 'public', 'blog.html'));
        }

        const plainTextContent = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        const jsonLd = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": ${JSON.stringify(post.title)},
          "image": "https://thelifeskillhub.com/${post.image_url}",
          "datePublished": ${JSON.stringify(post.date_iso)},
          "author": {
            "@type": "Person",
            "name": ${JSON.stringify(post.author)}
          },
          "publisher": {
            "@type": "Organization",
            "name": "The LifeSkill Hub",
            "logo": {
              "@type": "ImageObject",
              "url": "https://thelifeskillhub.com/asset/favicon.png"
            }
          },
          "description": ${JSON.stringify(post.description)},
          "articleBody": ${JSON.stringify(plainTextContent)}
        }
        </script>
        `;

        const currentUrl = `https://thelifeskillhub.com/blog/${post.slug}`;
        const encodedTitle = encodeURIComponent(post.title);
        
        let keyPointsHtml = '';
        if (post.key_points && Array.isArray(post.key_points) && post.key_points.length > 0) {
          const listItems = post.key_points.map(pt => `<li>${pt}</li>`).join('\n        ');
          keyPointsHtml = `
            <div class="key-points-box">
              <div class="key-points-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>KEY POINTS — ĐIỂM CỐT LÕI</span>
              </div>
              <ul class="key-points-list">
                ${listItems}
              </ul>
            </div>
          `;
        }

        let related = posts.filter(p => p.slug !== post.slug && p.category === post.category);
        if (related.length < 3) {
          const others = posts.filter(p => p.slug !== post.slug && p.category !== post.category);
          related = related.concat(others.slice(0, 3 - related.length));
        }
        related = related.slice(0, 4);

        const relatedPostsHtml = related.map(p => `
          <a href="/blog/${p.slug}" class="essential-read-item">
            <img src="../${p.image_url}" alt="${p.title}" class="essential-read-thumb" loading="lazy" />
            <div class="essential-read-info">
              <div class="essential-read-title">${p.title}</div>
              <div class="essential-read-meta">${p.read_time} • ${p.date}</div>
            </div>
          </a>
        `).join('\n');

        let html = templateData
          .replace(/\{\{TITLE\}\}/g, post.title)
          .replace(/\{\{META_DESC\}\}/g, post.description)
          .replace(/\{\{CATEGORY\}\}/g, post.category)
          .replace(/\{\{CATEGORY_NAME\}\}/g, post.category)
          .replace(/\{\{READ_TIME\}\}/g, post.read_time)
          .replace(/\{\{AUTHOR\}\}/g, post.author)
          .replace(/\{\{DATE\}\}/g, post.date)
          .replace(/\{\{IMAGE_URL\}\}/g, post.image_url)
          .replace(/\{\{CONTENT\}\}/g, post.content)
          .replace(/\{\{KEY_POINTS_HTML\}\}/g, keyPointsHtml)
          .replace(/\{\{RELATED_POSTS_HTML\}\}/g, relatedPostsHtml)
          .replace(/\{\{CURRENT_URL\}\}/g, currentUrl)
          .replace(/\{\{ENCODED_TITLE\}\}/g, encodedTitle)
          .replace(/\{\{JSON_LD\}\}/g, jsonLd);

        return res.send(html);
      });
    } catch (parseErr) {
      console.error("Parse posts error:", parseErr);
      return res.sendFile(path.join(__dirname, 'public', 'blog.html'));
    }
  });
});

// Redirect direct requests for index.html to clean URL /
app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

// Redirect old course 99 to new custom URL
app.get('/course-detail.html', (req, res, next) => {
  if (req.query.id === '99') {
    return res.redirect(301, '/khoa-hoc/tarot-va-tam-ly-hoc');
  }
  next();
});

// Serve static files from the public folder (auto-resolves .html and .css)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders: (res, filepath) => {
    // Disable caching for HTML files to prevent outdated pages
    if (filepath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
  }
}));

// Keep data folder accessible if it contains json data
app.use('/data', express.static(path.join(__dirname, 'data')));

// Fallback for any other route (404) -> redirect to home
app.get('*', (req, res) => res.redirect('/'));

// Start server only if run directly (local dev)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
