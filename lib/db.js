const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'my-brain', 'brain.db');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[SQLite] Lỗi khi mở database:', err.message);
  } else {
    console.log('[SQLite] Đã kết nối với brain.db');
  }
});

// Setup schema cho các bảng khóa học và đăng ký
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    category_class TEXT,
    price REAL,
    original_price REAL,
    description TEXT,
    custom_url TEXT,
    curriculum TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    age INTEGER,
    status TEXT,
    registered_at TEXT
  )`);
});

const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = { db, queryAsync, runAsync, getAsync };
