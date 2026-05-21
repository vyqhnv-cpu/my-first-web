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

// Tạo bảng products
db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    stock INTEGER DEFAULT 0
)`, err => { if (err) console.error('Lỗi khi tạo bảng products:', err.message); else console.log('Đã tạo bảng products'); });

// Tạo bảng customers
db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    zalo TEXT,
    registered_at TEXT
)`, err => { if (err) console.error('Lỗi khi tạo bảng customers:', err.message); else console.log('Đã tạo bảng customers'); });

// Tạo bảng orders
db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    order_date TEXT
)`, err => { if (err) console.error('Lỗi khi tạo bảng orders:', err.message); else console.log('Đã tạo bảng orders'); });

db.close((err) => {
    if (err) {
        return console.error('Lỗi khi đóng database:', err.message);
    }
    console.log('Đã đóng kết nối database.');
});
