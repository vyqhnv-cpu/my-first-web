const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Kho dữ liệu tách biệt hoàn toàn cho đăng ký phỏng vấn
const dbPath = path.resolve(__dirname, '../my-brain/interviews.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[Interviews SQLite] Lỗi kết nối:', err.message);
  } else {
    console.log('[Interviews SQLite] Đã kết nối với interviews.db');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS interview_registrations (
    registration_id TEXT PRIMARY KEY,
    submitted_at TEXT,
    nickname TEXT,
    contact_method TEXT,
    contact_value TEXT,
    preferred_format TEXT,
    availability TEXT,
    consent_contact INTEGER,
    consent_link_results INTEGER,
    link_code TEXT,
    status TEXT,
    notes TEXT
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
    db.run(sql, params, function (err) {
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

module.exports = {
  db,
  queryAsync,
  runAsync,
  getAsync
};
