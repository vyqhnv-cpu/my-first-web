const fs = require('fs');
const html = fs.readFileSync('public/blog.html', 'utf8');
const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
let m;
while (m = regex.exec(html)) {
  console.log(m[1]);
}
