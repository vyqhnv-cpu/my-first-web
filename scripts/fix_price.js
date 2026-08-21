const fs = require('fs');

// 1. Update api/courses.js
let coursesJs = fs.readFileSync('api/courses.js', 'utf8');

const oldLogic = `  const applyDynamicPrice = (course) => {
    if (course && (course.id === 99 || course.id == '99')) {
      const now = new Date();
      const targetDate = new Date('2026-08-22T23:59:59+07:00');
      if (now <= targetDate) {
        return { ...course, price: 0, original_price: 700000 };
      } else {
        return { ...course, price: 700000, original_price: null };
      }
    }
    return course;
  };`;

const newLogic = `  const applyDynamicPrice = (course) => {
    if (course && (course.id === 99 || course.id == '99')) {
      return { ...course, price: 199000, original_price: null };
    }
    return course;
  };`;

coursesJs = coursesJs.replace(oldLogic, newLogic);
coursesJs = coursesJs.replace('original_price: 700000,', 'original_price: null,');
fs.writeFileSync('api/courses.js', coursesJs);

// 2. Update all blog html files for the CTA
const path = require('path');
const blogDir = path.join(__dirname, '..', 'public', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

for (let file of files) {
    let html = fs.readFileSync(path.join(blogDir, file), 'utf8');
    // We want to replace "Miễn phí đến hết 22/08" and "Miễn phí đến 22/08" with "199.000đ"
    html = html.replace(/Miễn phí đến hết 22\/08/g, '199.000đ');
    html = html.replace(/Miễn phí đến 22\/08/g, '199.000đ');
    fs.writeFileSync(path.join(blogDir, file), html);
}
console.log('Updated api/courses.js and blog htmls.');
