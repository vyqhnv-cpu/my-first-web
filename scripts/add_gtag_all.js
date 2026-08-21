const fs = require('fs');
const path = require('path');

const gtagGlobal = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-995725258"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-995725258');
  gtag('config', 'AW-947708717');
</script>`;

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else { 
      if(file.endsWith('.html')) results.push(file);
    }
  });
  return results;
}

const htmlFiles = walkDir(path.join(__dirname, '..', 'public'));
htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if(!content.includes('AW-995725258')) {
    content = content.replace('</head>', gtagGlobal + '\n  </head>');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
