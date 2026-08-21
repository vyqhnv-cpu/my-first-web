const fs = require('fs');
const path = require('path');

const ctaHTML = `
<div style="background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); border: 1px solid #e879f9; border-radius: 12px; padding: 2rem; margin: 3rem 0;">
<h3 style="margin-top: 0; color: #86198f; font-size: 1.4rem;">💡 Khóa học gợi ý dành cho bạn:</h3>
<p style="color: #4a044e; line-height: 1.7;">Nếu bạn muốn có một lộ trình khoa học, bài bản kéo dài 8 buổi Online để bóc tách toàn bộ 22 nguyên mẫu tâm lý qua 22 lá Ẩn chính và bẻ gãy tận gốc các vòng lặp tiêu cực của bản thân, hãy tham khảo ngay khóa học đặc biệt tại The LifeSkill Hub:</p>
<p style="margin-top: 1.5rem; margin-bottom: 0;">
<a href="/khoa-hoc/tarot-va-tam-ly-hoc" style="display: inline-block; background: linear-gradient(135deg, #e11d48, #be123c); color: white; padding: 0.9rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.3);">Xem chi tiết Khóa học Tarot &amp; Tâm Lý Học (Miễn phí đến 22/08) &rarr;</a>
</p>
</div>
`;

// Helper to replace "Ưu đãi Early Bird" in the blog JSON ld
function updateJsonLd(content) {
    return content.replace(/Ưu đãi Early Bird/g, 'Miễn phí đến 22/08');
}

const blogDir = path.join(__dirname, '..', 'public', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

for (let file of files) {
    let content = fs.readFileSync(path.join(blogDir, file), 'utf8');

    if (file === 'tarot-va-tam-ly-hoc.html') {
        // 1. Change the existing CTA text in tarot-va-tam-ly-hoc
        content = content.replace(/Ưu đãi Early Bird/g, 'Miễn phí đến 22/08');
        
        // Remove the existing CTA first to avoid duplication
        const oldCtaRegex = /<div style="background: linear-gradient[^>]+>\s*<h3[^>]+>💡 Khóa học gợi ý dành cho bạn:[\s\S]+?<\/div>/;
        content = content.replace(oldCtaRegex, '');
        
        // We will insert it at the end of the post, right before <h2>FAQ
        // Actually, the user asked to insert it at the end of Section 1 and at the end of ALL blog posts.
        // Wait, for tarot, it says "Chỉnh lại CTA... thành Miễn phí đến hết 22/08", and "Chèn thêm CTA đã chỉnh sửa thông tin lên cuối Section 1."
        // Let's insert it at the end of Section 1.
        content = content.replace(/(Hình 1: Vòng lặp tâm lý vô thức khiến chúng ta liên tục tái diễn cùng một kịch bản lựa chọn\.\s*<\/p>\s*<\/div>)/, '$1\n' + ctaHTML);
        
        // And insert it at the end of the post (just before FAQ)
        content = content.replace(/(<h2>FAQ — Câu hỏi thường gặp)/, ctaHTML + '\n$1');
        
        fs.writeFileSync(path.join(blogDir, file), content);
        console.log('Updated tarot-va-tam-ly-hoc.html');
    } else {
        // 3. Insert CTA at the end of all other blog posts.
        // Find the end of <div class="article-body-content"> content </div>
        // To do this safely, we append it right before the closing </div> of article-body-content
        // But since we can't easily parse HTML with regex, we can insert it right before <!-- Call To Action (Lead Magnet) -->
        const parts = content.split('<!-- Call To Action (Lead Magnet) -->');
        if (parts.length === 2) {
            content = parts[0] + '\n' + ctaHTML + '\n<!-- Call To Action (Lead Magnet) -->' + parts[1];
            fs.writeFileSync(path.join(blogDir, file), content);
            console.log('Updated ' + file);
        } else {
            // fallback: find </div>\s*</div>\s*<!--
            console.log('Could not find Call To Action marker in ' + file);
        }
    }
}
