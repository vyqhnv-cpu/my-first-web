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

        let html = templateData
          .replace(/\{\{TITLE\}\}/g, post.title)
          .replace(/\{\{META_DESC\}\}/g, post.description)
          .replace(/\{\{CATEGORY\}\}/g, post.category)
          .replace(/\{\{READ_TIME\}\}/g, post.read_time)
          .replace(/\{\{AUTHOR\}\}/g, post.author)
          .replace(/\{\{DATE\}\}/g, post.date)
          .replace(/\{\{IMAGE_URL\}\}/g, post.image_url)
          .replace(/\{\{CONTENT\}\}/g, post.content)
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
