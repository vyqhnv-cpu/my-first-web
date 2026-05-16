const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'brain.db');

// Khởi tạo database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Lỗi khi mở database:', err.message);
    }
    console.log('Đã kết nối với SQLite database.');
});

db.serialize(() => {
    // Tạo bảng knowledge
    db.run(`CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            return console.error('Lỗi khi tạo bảng:', err.message);
        }
        console.log('Đã tạo bảng knowledge thành công.');
    });
});

db.close((err) => {
    if (err) {
        return console.error('Lỗi khi đóng database:', err.message);
    }
    console.log('Đã đóng kết nối database.');
});
