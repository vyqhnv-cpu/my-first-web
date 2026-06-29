# Ghi chú Triển khai (Deploy Notes)

Tài liệu này lưu lại các thông tin cấu hình quan trọng khi website được đưa lên VPS.

## 1. Biến môi trường (`.env`) cần có trên VPS

Dự án yêu cầu tạo một file `.env` tại thư mục gốc của dự án trên VPS (ví dụ `/opt/my-website/.env`), bao gồm các khóa sau:

```env
# Kết nối Supabase (DB)
SUPABASE_URL=https://gpydibzaymuubtkthomb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...

# Dịch vụ gửi Email
RESEND_API_KEY=re_ai8V8rrn_FZ5eNi59m7HJ3NAnoAvvdyEL

# Thông tin đăng nhập Admin Panel (/admin)
ADMIN_USER=admin
ADMIN_PASSWORD=admin123

# Key bảo mật cho Model-Context-Protocol (Tích hợp AI Agent goClaw)
MCP_API_KEY=gX9kLm2Zt7pQr1Vb8wY4e0s3c6nD5fHj

# Cổng khởi chạy Server
PORT=3000
```

## 2. Lệnh để chạy server

Website được quản lý thông qua **systemd** để đảm bảo chạy liên tục 24/7 và tự khởi động lại khi crash.
Tên service đã được đăng ký là: `mywebsite`

- **Kiểm tra trạng thái:** `sudo systemctl status mywebsite`
- **Khởi động lại server:** `sudo systemctl restart mywebsite`
- **Dừng server:** `sudo systemctl stop mywebsite`
- **Xem log lỗi/hoạt động:** `journalctl -u mywebsite -f`

*(Lưu ý: Systemd sẽ tự động thực thi lệnh `node server.js` từ thư mục `/opt/my-website`)*.

## 3. Cổng đang lắng nghe

- **Port nội bộ:** Server lắng nghe tại port **3000** (`http://0.0.0.0:3000`).
- **Endpoint kiểm tra HTTP:** `curl -I http://localhost:3000`
- **MCP Endpoint (dành cho goClaw):** `http://localhost:3000/api/mcp/sse`
