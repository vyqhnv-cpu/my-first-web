const fs = require('fs');

let content = fs.readFileSync('api/courses.js', 'utf8');

// Insert applyDynamicPrice outside of router endpoints
const helperFn = `
  const applyDynamicPrice = (course) => {
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
  };

  // Helper to merge DB data with mock fallbacks
`;

content = content.replace('  // Helper to merge DB data with mock fallbacks', helperFn);

// Apply it to GET /
content = content.replace('res.json(coursesCache);', 'res.json(coursesCache.map(applyDynamicPrice));');
content = content.replace('res.json(getSortedMock());', 'res.json(getSortedMock().map(applyDynamicPrice));');

// Apply it to GET /:id
content = content.replace('res.json(merged);', 'res.json(applyDynamicPrice(merged));');
content = content.replace('if (mock) return res.json(mock);', 'if (mock) return res.json(applyDynamicPrice(mock));');

fs.writeFileSync('api/courses.js', content);
