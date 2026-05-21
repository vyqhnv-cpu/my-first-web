const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'brain.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Lỗi khi mở database:', err.message);
  console.log('Đã kết nối với database.');
});

db.serialize(() => {
  // 1. Clear and Seed Products with Donation Packages
  db.run('DELETE FROM products', (err) => {
    if (err) return console.error('Lỗi khi xóa bảng sản phẩm cũ:', err.message);
    console.log('Đã xóa dữ liệu sản phẩm cũ.');
    
    const products = [
      ['Ủng hộ Gieo Mầm', 20000, 'Ủng hộ 20k giúp duy trì hoạt động cơ bản của Lifeskill Hub.', 999999],
      ['Ủng hộ Lan Tỏa', 50000, 'Ủng hộ 50k đồng hành phát triển các buổi chia sẻ cộng đồng.', 999999],
      ['Ủng hộ Đồng Hành', 100000, 'Ủng hộ 100k cùng Lifeskill Hub thiết kế lộ trình thấu hiểu bản thân.', 999999],
      ['Ủng hộ Kiến Tạo', 200000, 'Ủng hộ 200k hỗ trợ xây dựng tài liệu kỹ năng mềm miễn phí.', 999999],
      ['Ủng hộ Đại Sứ', 500000, 'Ủng hộ 500k trở thành đại sứ truyền cảm hứng của Lifeskill Hub.', 999999]
    ];
    const stmt = db.prepare('INSERT INTO products (name, price, description, stock) VALUES (?,?,?,?)');
    products.forEach(p => {
      stmt.run(p, (err) => {
        if (err) console.error('Lỗi chèn gói ủng hộ:', err.message);
      });
    });
    stmt.finalize();
    console.log('Đã nạp 5 gói ủng hộ thành công.');
  });

  // 2. Seed Customers if empty
  db.get('SELECT COUNT(*) as count FROM customers', [], (err, row) => {
    if (err) return console.error('Lỗi truy vấn khách hàng:', err.message);
    if (row.count === 0) {
      console.log('Bảng customers trống, đang nạp khách hàng mẫu...');
      const customers = [
        ['Nguyễn Văn An', '+84 912 345 678', 'an.nguyen', '2026-05-20T10:15:00+07:00'],
        ['Trần Thị Bình', '+84 923 456 789', 'binh.tran', '2026-05-20T11:30:45+07:00'],
        ['Lê Hoàng Nam', '+84 934 567 890', 'nam.le', '2026-05-20T12:05:12+07:00'],
        ['Phạm Văn Dũng', '+84 945 678 901', 'dung.pham', '2026-05-20T13:22:33+07:00'],
        ['Hoàng Thị Hiền', '+84 956 789 012', 'hien.hoang', '2026-05-20T14:45:20+07:00']
      ];
      const stmt = db.prepare('INSERT INTO customers (full_name, phone, zalo, registered_at) VALUES (?,?,?,?)');
      customers.forEach(c => {
        stmt.run(c, (err) => {
          if (err) console.error('Lỗi chèn khách hàng:', err.message);
        });
      });
      stmt.finalize();
      console.log('Đã nạp 5 khách hàng mẫu thành công.');
    } else {
      console.log('Đã có dữ liệu khách hàng trong DB.');
    }
  });
});

// Close database after seed
setTimeout(() => {
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Đã đóng kết nối database.');
  });
}, 2000);
