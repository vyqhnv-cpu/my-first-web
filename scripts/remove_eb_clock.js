const fs = require('fs');
let c = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');
c = c.replace(/<div id="eb-clock"[\s\S]*?<\/div>\s*<\/div>/, '');
fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', c);
