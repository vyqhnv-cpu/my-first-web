const fs = require('fs');

let content = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');

// 1. Remove eb-timer-container entirely from HERO
const ebTimerRegex = /<!-- Timer 1: Early Bird in Hero -->[\s\S]*?<div id="eb-timer-container" class="glass-timer">[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(ebTimerRegex, '');

// 2. Change the button below the HERO
content = content.replace('Đăng ký học trải nghiệm miễn phí', 'Đăng ký khóa học (199.000đ)');

// 3. Change "Đăng ký học trải nghiệm miễn phí" at the bottom
content = content.replace('Đăng ký học trải nghiệm miễn phí', 'Đăng ký khóa học (199.000đ)');

// 4. Change the "Học phí trải nghiệm" line
content = content.replace('<li><strong>Học phí trải nghiệm:</strong> Miễn phí (giá gốc 700.000đ) — áp dụng đến hết ngày 22/08</li>', '<li><strong>Học phí:</strong> 199.000đ</li>');

// 5. Update Sidebar price
content = content.replace('<div id="price-original" style="text-decoration: line-through; color: var(--color-muted); font-size: 1.1rem; margin-bottom: 0.5rem; display: block;">\n                700.000 ₫\n              </div>', '');
content = content.replace('<div id="price-current" style="font-size: 2.5rem; font-weight: 800; color: var(--color-secondary);">\n                Miễn phí\n              </div>', '<div id="price-current" style="font-size: 2.5rem; font-weight: 800; color: var(--color-secondary);">\n                199.000 ₫\n              </div>');
content = content.replace('<span id="sidebar-subtitle">Khai giảng 25/8/2026 — Đăng ký ngay để giữ suất học miễn phí</span>', '<span id="sidebar-subtitle">Khai giảng 25/8/2026</span>');
content = content.replace('<span style="font-weight: 700; font-size: 1.1rem;">Đăng ký giữ chỗ</span>\n                <span style="font-size: 0.85rem; font-weight: 400; margin-top: 0.25rem;">(Số lượng ưu đãi giới hạn. Tư vấn viên sẽ liên hệ trong 24h)</span>', '<span style="font-weight: 700; font-size: 1.1rem;">Đăng ký khóa học</span>\n                <span style="font-size: 0.85rem; font-weight: 400; margin-top: 0.25rem;">(Tư vấn viên sẽ liên hệ trong 24h)</span>');

// 6. Fix JS countdown logic to remove Early Bird JS logic
const jsCountdownRegex = /\/\/ Early Bird Timer[\s\S]*?\/\/ Khai giảng Timer/g;
content = content.replace(jsCountdownRegex, '// Khai giảng Timer');

const targetEbRegex = /const targetEB = new Date\('2026-08-22T23:59:59\+07:00'\)\.getTime\(\);\s*/g;
content = content.replace(targetEbRegex, '');

fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', content);
console.log('Fixed tarot HTML.');
