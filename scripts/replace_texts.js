const fs = require('fs');
let c = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');

c = c.replace(/Khóa học Tarot/g, 'Chuỗi workshop Tarot');
c = c.replace(/khóa học Tarot/g, 'chuỗi workshop Tarot');
c = c.replace(/khóa học này/g, 'chuỗi workshop này');
c = c.replace(/Đăng ký khóa học/g, 'Đăng ký chuỗi workshop');
c = c.replace(/KHÓA HỌC MỚI/g, 'CHUỖI WORKSHOP MỚI');
c = c.replace(/Thông tin khóa học/g, 'Thông tin chuỗi workshop');
c = c.replace(/Khóa học đã khai giảng/g, 'Chuỗi workshop đã khai giảng');
c = c.replace(/Khóa học/g, 'Chuỗi workshop');
c = c.replace(/khóa học/g, 'chuỗi workshop');

// Restore URLs and classes just in case
c = c.replace(/chuỗi workshop-detail-hero/g, 'course-detail-hero');
c = c.replace(/chuỗi workshop-detail-meta/g, 'course-detail-meta');
c = c.replace(/chuỗi workshop-content/g, 'course-content');
c = c.replace(/\/chuỗi workshop\//g, '/khoa-hoc/');
c = c.replace(/public\/chuỗi workshop\//g, 'public/khoa-hoc/');
c = c.replace(/href="\/courses\.html" class="active">Chuỗi workshop<\/a>/g, 'href="/courses.html" class="active">Khóa học</a>');

fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', c);
