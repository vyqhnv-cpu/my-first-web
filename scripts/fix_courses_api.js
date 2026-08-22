const fs = require('fs');
let c = fs.readFileSync('api/courses.js', 'utf8');

c = c.replace(
  "title: 'Khóa học Tarot & Tâm lý học — Hiểu chính mình qua 22 lá Ẩn chính',",
  "title: 'Chuỗi workshop Tarot & Tâm lý học — Hiểu chính mình qua 22 lá Ẩn chính',"
);

c = c.replace(
  "description: 'Khóa học Tarot & Tâm lý học 8 buổi Online. Giải mã 22 lá Ẩn chính dưới góc nhìn tâm lý học, hiểu vòng lặp suy nghĩ và hành vi của chính mình.',",
  "description: 'Chuỗi workshop Tarot & Tâm lý học 8 buổi Online. Giải mã 22 lá Ẩn chính dưới góc nhìn tâm lý học, hiểu vòng lặp suy nghĩ và hành vi của chính mình.',"
);

fs.writeFileSync('api/courses.js', c);
