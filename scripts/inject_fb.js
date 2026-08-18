const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const scriptTag = '<!-- Facebook Tracking -->\n    <script src="/asset/fb-tracking.js"></script>\n';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (!content.includes('fb-tracking.js')) {
        // Insert right before </head>
        content = content.replace('</head>', `${scriptTag}</head>`);
        fs.writeFileSync(fullPath, content);
        console.log(`Injected FB tracking into ${fullPath}`);
      } else {
        console.log(`Already injected in ${fullPath}`);
      }
    }
  }
}

processDirectory(publicDir);
console.log('Done injecting FB tracking into HTML files.');
