# Báo cáo chuẩn bị Deploy lên VPS (Linux)

## 1. Ngôn ngữ & Framework đang sử dụng
- **Backend:** Node.js với framework Express.js.
- **Frontend:** HTML, CSS, JavaScript thuần.
- **Cơ sở dữ liệu & Dịch vụ:** Sử dụng Supabase (PostgreSQL + API) và Resend (để gửi email).

## 2. Các file cần tạo thêm để deploy
Hiện tại dự án đang được cấu hình để deploy lên Vercel (`vercel.json`). Để chạy trên VPS Linux, bạn cần bổ sung:
- **`ecosystem.config.js`** (Khuyên dùng): File cấu hình cho PM2 để quản lý process Node.js, giúp ứng dụng tự động chạy lại khi crash hoặc khi server khởi động lại.
- **Hoặc `Dockerfile` / `docker-compose.yml`**: Nếu bạn muốn deploy bằng Docker.
- **File cấu hình Nginx (Tạo trên VPS)**: Dùng để làm Reverse Proxy, chuyển hướng request từ cổng 80/443 vào cổng 3000 của Node.js, và cài đặt SSL (HTTPS).

## 3. Các thông tin bí mật (API Key) đang bị lộ trong code
Có những thông tin rất quan trọng đang bị hardcode thẳng vào source code, bạn **CẦN PHẢI SỬA** trước khi đẩy code lên mạng:
- **Resend API Key:** Trong file `server.js` (dòng 12), key `re_Yh2eBit5_B4trFa1cYnoKNFPGwHmBEK8C` đang bị lộ.
- **Basic Auth Credentials:** Trong file `server.js` (dòng 19), tài khoản đăng nhập trang admin đang bị hardcode: `admin: 'admin123'`. 
- **Lưu ý phụ:** Trong `index.html` (khoảng dòng 360), `SUPABASE_ANON_KEY` đang được hardcode. Mặc dù Anon Key được thiết kế để công khai, nhưng bạn nên lưu ý không dùng Service Role Key ở đây.

**Cách khắc phục:** Chuyển Resend API Key, Admin Username, và Admin Password vào file `.env` và gọi qua `process.env`.

## 4. Danh sách đầy đủ các bước cần chuẩn bị trước khi deploy

### Chuẩn bị Source Code
- [ ] Xóa các API Key và Password bị hardcode trong `server.js`. Chuyển chúng vào file `.env`.
- [ ] Cập nhật lại logic trong `server.js` để đọc: `process.env.RESEND_API_KEY`, `process.env.ADMIN_USER`, `process.env.ADMIN_PASS`.
- [ ] Tạo file `.env` mẫu (ví dụ `.env.example`) nhưng không chứa key thật để commit lên Git.

### Cấu hình trên VPS Linux
- [ ] **Cài đặt môi trường:** Cài đặt Node.js (phiên bản tương thích, khuyên dùng LTS) và npm.
- [ ] **Cài đặt PM2:** Chạy lệnh `npm install -g pm2` để cài đặt PM2.
- [ ] **Cài đặt Git:** Để clone source code từ repository (GitHub/GitLab) về VPS.
- [ ] **Cài đặt Nginx:** Làm Web Server / Reverse Proxy.
- [ ] **Khởi tạo file `.env` trên VPS:** Tạo file `.env` trên VPS và điền các key thật (Supabase URL, Anon/Service Keys, Resend API Key, Admin credentials).

### Các bước Deploy
- [ ] Clone code về VPS và chạy `npm install` để cài đặt thư viện (`node_modules`).
- [ ] Khởi chạy ứng dụng bằng PM2: `pm2 start server.js --name "my-first-web"` (hoặc dùng `ecosystem.config.js`).
- [ ] Cấu hình PM2 tự khởi động cùng hệ thống: `pm2 startup` và `pm2 save`.
- [ ] Cấu hình Nginx: Trỏ domain của bạn về IP của VPS, cấu hình Nginx proxy pass vào `localhost:3000`.
- [ ] Cài đặt chứng chỉ SSL/HTTPS: Sử dụng Certbot (Let's Encrypt) để tự động cấp chứng chỉ SSL miễn phí (`sudo certbot --nginx`).
- [ ] Kiểm tra lại các tính năng: Gửi email, kết nối Supabase, truy cập trang admin.
