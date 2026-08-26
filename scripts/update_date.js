const fs = require('fs');

let html = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');
html = html.replace('19h30', '18h30');
html = html.replace('25/08', '26/08');
html = html.replace(/new Date\('2026-08-\d\dT\d\d:\d\d:\d\d\+07:00'\)\.getTime\(\)/, "new Date('2026-08-26T18:30:00+07:00').getTime()");
fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', html);

let api = fs.readFileSync('api/courses.js', 'utf8');
api = api.replace('25/8/2026', '26/8/2026');
fs.writeFileSync('api/courses.js', api);
