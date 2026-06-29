const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'my-brain', 'brain.db');
const outDir = path.join(__dirname, 'vault-ready');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const fileMapping = {
  'brand_voice': 'brand-voice',
  'knowledge': 'knowledge-base',
  'business': 'my-business'
};

db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
  if (err) throw err;
  
  let allTables = tables.map(t => t.name);
  console.log("Tables found:", allTables);

  let processedCount = 0;
  const tableData = {};

  allTables.forEach(tableName => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) throw err;
      tableData[tableName] = rows;
      processedCount++;
      if (processedCount === allTables.length) {
        generateMarkdown(tableData);
      }
    });
  });
});

function generateMarkdown(tableData) {
  let fileList = [];
  
  for (const [tableName, rows] of Object.entries(tableData)) {
    if (rows.length === 0) continue;
    
    let fileName = fileMapping[tableName] || tableName;
    let filePath = path.join(outDir, `${fileName}.md`);
    fileList.push(fileName);
    
    let content = `# ${fileName}\n\n`;
    
    rows.forEach(row => {
      for (const [key, val] of Object.entries(row)) {
        if (key !== 'id') {
          content += `**${key}:** ${val}\n\n`;
        }
      }
      content += `---\n\n`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  // Cross-link pass
  let totalWords = 0;
  fileList.forEach(fileName => {
    let filePath = path.join(outDir, `${fileName}.md`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add wikilinks
    fileList.forEach(target => {
      if (target !== fileName) {
        // e.g. 'brand-voice' -> replace 'brand voice' with '[[brand-voice]]'
        let phrase = target.replace(/-/g, ' ');
        let regex = new RegExp(`(?<!\\[\\[)(${phrase})(?!\\]\\])`, 'gi');
        content = content.replace(regex, `[[${target}]]`);
      }
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    // Count words
    totalWords += content.split(/\s+/).filter(w => w.length > 0).length;
  });
  
  // Generate index.md
  let indexContent = `# Index\n\n`;
  fileList.forEach(fileName => {
    indexContent += `- [[${fileName}]]\n`;
  });
  fs.writeFileSync(path.join(outDir, 'index.md'), indexContent, 'utf8');
  
  // Count words for index
  totalWords += indexContent.split(/\s+/).filter(w => w.length > 0).length;
  
  console.log(`Generated ${fileList.length + 1} files (including index.md).`);
  console.log(`Total words: ${totalWords}`);
  
  db.close();
}
