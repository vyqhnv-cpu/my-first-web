const path = require('path');
const fs = require('fs');
const { z } = require('zod');
const sqlite3 = require('sqlite3').verbose();

// Helper to clean/sanitize raw diary text based on sync_diary.ps1 rules
function cleanDiaryText(rawText) {
  if (!rawText) return "";
  let clean = rawText;
  clean = clean.replace(/đọc chú/gi, "thực hành rèn luyện tâm trí");
  clean = clean.replace(/đi chùa/gi, "thực hành rèn luyện tại không gian yên tĩnh");
  clean = clean.replace(/phạm giới tà dâm/gi, "chưa kiểm soát được kỷ luật cá nhân");
  clean = clean.replace(/vô ơn/gi, "thiếu sự trân trọng");
  return clean;
}

// Helper to format currency
function formatCurrency(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return "0đ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Helper to format dates
function formatDate(isoString) {
  if (!isoString) return 'Chưa rõ';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

// Define the tool registration logic
function registerTools(server) {
  // Tool 1: sync_daily_diary
  server.registerTool(
    "sync_daily_diary",
    {
      description: "Làm sạch câu chữ trong nhật ký theo Brand Voice và lưu vào SQLite database + file Markdown my-brain/nhat_ky.md.",
      inputSchema: z.object({
        raw_text: z.string().describe("Nội dung nhật ký thô (chưa qua xử lý) ghi chép cảm xúc, sự kiện trong ngày.")
      })
    },
    async ({ raw_text }) => {
      try {
        const cleaned = cleanDiaryText(raw_text);
        const mdPath = path.resolve(__dirname, '..', 'my-brain', 'nhat_ky.md');
        const dbPath = path.resolve(__dirname, '..', 'my-brain', 'brain.db');

        // SQLite connection and write
        const db = new sqlite3.Database(dbPath);
        let db_sync_status = false;
        let db_error = null;

        await new Promise((resolve) => {
          db.run(
            `INSERT INTO knowledge (category, content) VALUES (?, ?)`,
            ['Nhật ký/Kinh nghiệm', `Ngày ${new Date().toLocaleDateString('vi-VN')}: ${cleaned}`],
            function(err) {
              if (err) {
                db_error = err.message;
              } else {
                db_sync_status = true;
              }
              db.close();
              resolve();
            }
          );
        });

        // Markdown append
        let file_sync_status = false;
        let file_error = null;
        try {
          const currentDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
          const entryString = `- [${currentDate}]: ${cleaned}\n\n`;
          
          if (!fs.existsSync(mdPath)) {
            const dataDir = path.dirname(mdPath);
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(mdPath, `# Nhat ky dong bo tu Excel (Cap nhat: ${currentDate})\n\n`, 'utf8');
          }
          fs.appendFileSync(mdPath, entryString, 'utf8');
          file_sync_status = true;
        } catch (err) {
          file_error = err.message;
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: db_sync_status && file_sync_status,
              cleaned_text: cleaned,
              db_sync_status,
              db_error,
              file_sync_status,
              file_error
            }, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: "text",
            text: `Lỗi trong quá trình xử lý nhật ký: ${err.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 2: get_business_dashboard
  server.registerTool(
    "get_business_dashboard",
    {
      description: "Truy vấn số liệu đăng ký khách hàng, đơn hàng, doanh thu và sản phẩm sắp hết chỗ từ Supabase.",
      inputSchema: z.object({
        period: z.enum(["today", "yesterday", "this_week"]).describe("Khoảng thời gian cần báo cáo (today, yesterday, hoặc this_week).")
      })
    },
    async ({ period }) => {
      try {
        const { supabase } = require('../lib/supabase');

        // Calculate time range
        const now = new Date();
        let startDate;
        if (period === 'yesterday') {
          const yesterdayStart = new Date();
          yesterdayStart.setDate(now.getDate() - 1);
          yesterdayStart.setHours(0,0,0,0);
          const yesterdayEnd = new Date();
          yesterdayEnd.setDate(now.getDate() - 1);
          yesterdayEnd.setHours(23,59,59,999);
          startDate = yesterdayStart;
        } else if (period === 'this_week') {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0,0,0,0);
        } else { // 'today'
          startDate = new Date();
          startDate.setHours(0,0,0,0);
        }

        const startISO = startDate.toISOString();

        // 1. Fetch Customers
        const { data: customers, error: custError } = await supabase
          .from('customers')
          .select('id, full_name, registered_at')
          .gte('registered_at', startISO);

        if (custError) throw new Error(`Lỗi Supabase (Customers): ${custError.message}`);

        // 2. Fetch Orders
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('id, amount, status, order_date, product_id, customer_id')
          .gte('order_date', startISO);

        if (orderError) throw new Error(`Lỗi Supabase (Orders): ${orderError.message}`);

        // 3. Fetch Products for Stock Warning
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('id, name, stock, price');

        if (prodError) throw new Error(`Lỗi Supabase (Products): ${prodError.message}`);

        // Process data
        const newCustomersCount = (customers || []).length;
        const newCustomersList = (customers || []).map(c => `- **${c.full_name}** (Đăng ký lúc: ${formatDate(c.registered_at)})`).join('\n') || "_Không có đăng ký mới_";

        const completedOrders = (orders || []).filter(o => o.status === 'completed');
        const pendingOrders = (orders || []).filter(o => o.status === 'pending');

        const totalCompletedAmount = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

        const lowStockProducts = (products || []).filter(p => p.stock < 3);
        const lowStockList = lowStockProducts.map(p => `- ⚠️ **${p.name}**: Còn **${p.stock}** lượt khả dụng`).join('\n') || "_Tất cả sản phẩm đều đủ lượt khả dụng_";

        const reportMarkdown = `### 📊 BÁO CÁO KẾT QUẢ KINH DOANH (${period.toUpperCase()})
Thời gian báo cáo: Từ *${formatDate(startISO)}* đến nay.

👥 **Khách hàng mới (Waitlist):** ${newCustomersCount} người đăng ký
${newCustomersList}

💰 **Giao dịch HOÀN THÀNH (Completed):** ${completedOrders.length} lượt
- Tổng doanh thu thực nhận: **${formatCurrency(totalCompletedAmount)}**

⏳ **Giao dịch ĐANG CHỜ (Pending):** ${pendingOrders.length} lượt
- Số tiền đang chờ xác thực: **${formatCurrency(totalPendingAmount)}**

⚠️ **Cảnh báo giới hạn lượt (Stock < 3):**
${lowStockList}`;

        return {
          content: [{
            type: "text",
            text: reportMarkdown
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: "text",
            text: `Lỗi khi lấy báo cáo: ${err.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 3: search_customer_profile
  server.registerTool(
    "search_customer_profile",
    {
      description: "Tra cứu thông tin khách hàng, chi tiết liên hệ Zalo/Email và lịch sử các đơn hàng/đóng góp từ Supabase.",
      inputSchema: z.object({
        search_query: z.string().describe("Từ khóa tìm kiếm (Họ tên, SĐT, Email hoặc Link Zalo).")
      })
    },
    async ({ search_query }) => {
      try {
        const { supabase } = require('../lib/supabase');

        // Fetch matched customers
        const { data: customers, error: custError } = await supabase
          .from('customers')
          .select('*')
          .or(`full_name.ilike.%${search_query}%,phone.ilike.%${search_query}%,email.ilike.%${search_query}%,zalo.ilike.%${search_query}%`);

        if (custError) throw new Error(`Lỗi tìm kiếm khách hàng: ${custError.message}`);

        if (!customers || customers.length === 0) {
          return {
            content: [{
              type: "text",
              text: `🔍 Không tìm thấy khách hàng nào khớp với từ khóa: "${search_query}"`
            }]
          };
        }

        // Fetch products cache to map product names
        const { data: products } = await supabase.from('products').select('id, name');
        const productMap = new Map((products || []).map(p => [p.id, p.name]));

        let resultMarkdown = `🔍 Tìm thấy **${customers.length}** kết quả phù hợp:\n\n---\n\n`;

        for (const customer of customers) {
          // Fetch orders for this customer
          const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customer.id);

          let ordersText = "_Chưa có lịch sử giao dịch/đóng góp_";
          if (orders && orders.length > 0) {
            ordersText = orders.map(o => {
              const prodName = productMap.get(o.product_id) || `Gói #${o.product_id}`;
              const statusBadge = o.status === 'completed' ? '🟢 Hoàn thành' : o.status === 'pending' ? '🟡 Đang xử lý' : '🔴 Đã hủy';
              return `- **${prodName}**: ${formatCurrency(o.amount)} (${statusBadge}) vào ngày ${formatDate(o.order_date)}`;
            }).join('\n');
          }

          resultMarkdown += `### 👤 KHÁCH HÀNG: ${customer.full_name}
- **Mã KH:** #${customer.id}
- **Điện thoại:** \`${customer.phone || 'Chưa rõ'}\`
- **Email:** \`${customer.email || 'Chưa rõ'}\`
- **Zalo/Liên hệ khác:** ${customer.zalo || '_Không có ghi chú_'}
- **Ngày đăng ký:** ${formatDate(customer.registered_at)}

🛍️ **Lịch sử giao dịch/ủng hộ:**
${ordersText}

\n---\n\n`;
        }

        return {
          content: [{
            type: "text",
            text: resultMarkdown.trim()
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: "text",
            text: `Lỗi khi tra cứu khách hàng: ${err.message}`
          }],
          isError: true
        };
      }
    }
  );
  // Tool 4: check_new_forms
  server.registerTool(
    "check_new_forms",
    {
      description: "Kiểm tra xem có khách hàng nào vừa điền form Khai Vấn hoặc Khảo sát mới hay không (dành cho Heartbeat).",
      inputSchema: z.object({})
    },
    async () => {
      try {
        const { supabase } = require('../lib/supabase');
        const stateFile = path.resolve(__dirname, '..', 'my-brain', 'alert_state.json');
        
        let state = { last_event_check: new Date(Date.now() - 24*60*60*1000).toISOString(), last_daily_report: "" };
        if (fs.existsSync(stateFile)) {
          try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch (e) {}
        }
        
        const lastCheck = state.last_event_check;
        const now = new Date().toISOString();

        // Check section_dangki11
        const { data: leads, error: leadErr } = await supabase
          .from('section_dangki11')
          .select('*')
          .gt('created_at', lastCheck);

        // Check surveys
        const { data: surveys, error: survErr } = await supabase
          .from('surveys')
          .select('*')
          .gt('created_at', lastCheck);

        if (leadErr) console.error("Lead Error:", leadErr);
        if (survErr) console.error("Survey Error:", survErr);

        const newLeads = leads || [];
        const newSurveys = surveys || [];

        if (newLeads.length === 0 && newSurveys.length === 0) {
          // Update state to now so we don't query old data again
          state.last_event_check = now;
          fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
          
          return { content: [{ type: "text", text: "Không có sự kiện form mới. Không cần làm gì." }] };
        }

        // Format message
        let msg = "🚨 BÁO CÁO CÓ KHÁCH HÀNG MỚI ĐIỀN FORM:\n\n";
        
        if (newLeads.length > 0) {
          msg += `📝 **FORM KHAI VẤN (${newLeads.length} người):**\n`;
          newLeads.forEach(l => {
            msg += `- **${l.full_name || 'Chưa rõ'}** (SĐT: ${l.phone || 'Không có'}, Email: ${l.email || 'Không có'})\n`;
            msg += `  Lĩnh vực: ${l.interest || 'Không chọn'}\n`;
            msg += `  Tin nhắn: ${l.message || 'Không có'}\n\n`;
          });
        }

        if (newSurveys.length > 0) {
          msg += `📋 **FORM KHẢO SÁT (${newSurveys.length} người):**\n`;
          newSurveys.forEach(s => {
            msg += `- **${s.full_name || 'Chưa rõ'}** (SĐT: ${s.phone || 'Không có'}, Email: ${s.email || 'Không có'})\n`;
            msg += `  Vấn đề lo lắng: ${s.concerns || 'Không có'}\n`;
            msg += `  Trực tiếp hay Online: ${s.meeting_preference || 'Không rõ'}\n\n`;
          });
        }

        msg += "\nYêu cầu Agent: Hãy gửi ngay tin nhắn báo cáo này cho user (Gấu).";

        // Update state
        state.last_event_check = now;
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');

        return { content: [{ type: "text", text: msg }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
      }
    }
  );

  // Tool 5: check_daily_report
  server.registerTool(
    "check_daily_report",
    {
      description: "Kiểm tra xem đã đến 22:00 chưa để gửi Báo cáo kinh doanh tổng hợp trong ngày (dành cho Heartbeat).",
      inputSchema: z.object({})
    },
    async () => {
      try {
        const stateFile = path.resolve(__dirname, '..', 'my-brain', 'alert_state.json');
        
        let state = { last_event_check: new Date(Date.now() - 24*60*60*1000).toISOString(), last_daily_report: "" };
        if (fs.existsSync(stateFile)) {
          try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch (e) {}
        }
        
        const now = new Date();
        // Convert to Vietnam time
        const vnTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
        const todayStr = vnTime.toLocaleDateString("vi-VN"); // e.g. 25/5/2026
        const currentHour = vnTime.getHours();

        if (currentHour < 22) {
          return { content: [{ type: "text", text: "Chưa đến 22:00, không cần gửi báo cáo." }] };
        }

        if (state.last_daily_report === todayStr) {
          return { content: [{ type: "text", text: "Đã gửi báo cáo cho ngày hôm nay rồi, không cần gửi lại." }] };
        }

        // Generate report by calling get_business_dashboard logic directly or rewriting a quick fetch
        const { supabase } = require('../lib/supabase');
        const startDate = new Date();
        startDate.setHours(0,0,0,0);
        const startISO = startDate.toISOString();

        // 1. Fetch Customers
        const { data: customers } = await supabase.from('customers').select('id, full_name, registered_at').gte('registered_at', startISO);
        // 2. Fetch Orders
        const { data: orders } = await supabase.from('orders').select('id, amount, status, order_date, product_id, customer_id').gte('order_date', startISO);
        
        const newCustomersCount = (customers || []).length;
        const completedOrders = (orders || []).filter(o => o.status === 'completed');
        const pendingOrders = (orders || []).filter(o => o.status === 'pending');
        const totalCompletedAmount = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

        const reportMarkdown = `📈 **BÁO CÁO KINH DOANH CUỐI NGÀY (Lúc 22:00)**\n\n` +
          `👥 Khách hàng mới hôm nay: **${newCustomersCount}** người\n` +
          `💰 Giao dịch hoàn thành: **${completedOrders.length}** lượt (Doanh thu: **${formatCurrency(totalCompletedAmount)}**)\n` +
          `⏳ Giao dịch chờ xử lý: **${pendingOrders.length}** lượt (Số tiền: **${formatCurrency(totalPendingAmount)}**)\n\n` +
          `Yêu cầu Agent: Hãy tóm tắt và gửi ngay báo cáo tổng hợp này cho user (Gấu) chúc ngủ ngon.`;

        // Update state
        state.last_daily_report = todayStr;
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');

        return { content: [{ type: "text", text: reportMarkdown }] };

      } catch (err) {
        return { content: [{ type: "text", text: `Lỗi báo cáo hằng ngày: ${err.message}` }], isError: true };
      }
    }
  );
}

module.exports = {
  registerTools
};
