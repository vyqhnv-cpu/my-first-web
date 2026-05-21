const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Path to the SQLite DB (relative to project root)
const dbPath = path.join(__dirname, 'my-brain', 'brain.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Cannot open DB:', err.message);
    process.exit(1);
  }
});

// Helper: convert rows to CSV string (including header)
function rowsToCsv(columns, rows) {
  const header = columns.join(',');
  const lines = rows.map(row =>
    columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      // Escape double quotes by doubling them
      const str = String(val).replace(/"/g, '""');
      // If value contains comma, newline or quote, wrap in quotes
      if (/[,\n\r\"]/.test(str)) {
        return `"${str}"`;
      }
      return str;
    }).join(',')
  );
  return header + '\n' + lines.join('\n');
}

function exportTable(tableName, outputFile) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) return reject(err);
      if (rows.length === 0) {
        // Write empty file with just header (no rows)
        fs.writeFileSync(outputFile, `${Object.keys(rows[0] || {}).join(',')}\n`);
        return resolve();
      }
      const columns = Object.keys(rows[0]);
      const csv = rowsToCsv(columns, rows);
      fs.writeFileSync(outputFile, csv);
      resolve();
    });
  });
}

(async () => {
  try {
    const outDir = path.join(__dirname, 'exported_csv');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    await exportTable('customers', path.join(outDir, 'customers.csv'));
    console.log('Exported customers.csv');
    await exportTable('products', path.join(outDir, 'products.csv'));
    console.log('Exported products.csv');
    await exportTable('orders', path.join(outDir, 'orders.csv'));
    console.log('Exported orders.csv');
  } catch (e) {
    console.error('Export error:', e);
    process.exit(1);
  } finally {
    db.close();
  }
})();
