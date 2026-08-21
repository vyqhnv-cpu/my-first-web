const fs = require('fs');
let content = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');

const relatedArticlesHtml = `
    <!-- RELATED ARTICLES -->
    <section class="related-articles-section" style="padding: 4rem 0; background-color: var(--color-background);">
      <div class="container">
        <h2 style="font-size: 2rem; color: var(--color-primary); margin-bottom: 2.5rem; text-align: center;">Đọc thêm bài viết liên quan</h2>
        <div class="articles-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem;">
          
          <!-- Article 1 -->
          <article class="article-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <div class="article-img-box" style="position: relative; padding-top: 56.25%;">
              <span class="article-badge" style="position: absolute; top: 1rem; left: 1rem; background: var(--color-primary); color: white; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 2;">Tâm lý học</span>
              <img src="/asset/vong_lap.webp" alt="Tarot & Tâm lý học" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            </div>
            <div class="article-body" style="padding: 1.5rem;">
              <h3 class="article-card-title" style="margin-bottom: 0.75rem; font-size: 1.25rem;">
                <a href="/blog/tarot-va-tam-ly-hoc.html" style="color: var(--color-primary); text-decoration: none;">Tarot dưới góc nhìn Tâm lý học Carl Jung: Bản thiết kế vô thức</a>
              </h3>
              <p class="article-card-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                "Lần này sẽ khác" - Đã bao nhiêu lần bạn tự nhủ câu nói đó? Cùng khám phá nguyên mẫu tâm lý qua 22 lá Ẩn chính và cách giải mã vòng lặp vô thức của bạn.
              </p>
              <div class="article-card-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="article-date" style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">20 Tháng 8, 2026</span>
                <a href="/blog/tarot-va-tam-ly-hoc.html" style="color: var(--color-accent); font-weight: 600; font-size: 0.9rem; text-decoration: none;">Đọc tiếp &rarr;</a>
              </div>
            </div>
          </article>

          <!-- Article 2 -->
          <article class="article-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <div class="article-img-box" style="position: relative; padding-top: 56.25%;">
              <span class="article-badge" style="position: absolute; top: 1rem; left: 1rem; background: var(--color-primary); color: white; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 2;">Thói quen</span>
              <img src="/asset/blog_morning.png" alt="5 Thói quen buổi sáng" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            </div>
            <div class="article-body" style="padding: 1.5rem;">
              <h3 class="article-card-title" style="margin-bottom: 0.75rem; font-size: 1.25rem;">
                <a href="/blog/5-thoi-quen-buoi-sang.html" style="color: var(--color-primary); text-decoration: none;">5 Thói quen buổi sáng để bắt đầu ngày mới đầy năng lượng</a>
              </h3>
              <p class="article-card-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                Cách bạn bắt đầu 60 phút đầu tiên của buổi sáng quyết định trực tiếp đến trạng thái tinh thần và năng suất làm việc của cả ngày hôm đó.
              </p>
              <div class="article-card-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="article-date" style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">12 Tháng 5, 2026</span>
                <a href="/blog/5-thoi-quen-buoi-sang.html" style="color: var(--color-accent); font-weight: 600; font-size: 0.9rem; text-decoration: none;">Đọc tiếp &rarr;</a>
              </div>
            </div>
          </article>

          <!-- Article 3 -->
          <article class="article-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <div class="article-img-box" style="position: relative; padding-top: 56.25%;">
              <span class="article-badge" style="position: absolute; top: 1rem; left: 1rem; background: var(--color-primary); color: white; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 2;">Tư duy</span>
              <img src="/asset/blog_impostor.png" alt="Hội chứng kẻ mạo danh" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            </div>
            <div class="article-body" style="padding: 1.5rem;">
              <h3 class="article-card-title" style="margin-bottom: 0.75rem; font-size: 1.25rem;">
                <a href="/blog/vuot-qua-impostor-syndrome.html" style="color: var(--color-primary); text-decoration: none;">Vượt qua Hội chứng Kẻ Mạo Danh (Impostor Syndrome)</a>
              </h3>
              <p class="article-card-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                Bạn luôn cảm thấy mình không đủ giỏi và sợ bị người khác "bóc phốt" sự yếu kém? Khám phá 4 chiến lược thiết thực để vượt qua cảm giác tồi tệ này.
              </p>
              <div class="article-card-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="article-date" style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">02 Tháng 5, 2026</span>
                <a href="/blog/vuot-qua-impostor-syndrome.html" style="color: var(--color-accent); font-weight: 600; font-size: 0.9rem; text-decoration: none;">Đọc tiếp &rarr;</a>
              </div>
            </div>
          </article>
          
        </div>
        <div style="text-align: center; margin-top: 3.5rem;">
          <a href="/blog.html" style="display: inline-block; padding: 0.75rem 2rem; border: 2px solid var(--color-primary); color: var(--color-primary); border-radius: 50px; text-decoration: none; font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.background='var(--color-primary)'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='var(--color-primary)';">Xem tất cả bài viết tại Blog</a>
        </div>
      </div>
    </section>
`;

content = content.replace('    <!-- FOOTER -->', relatedArticlesHtml + '\n\n    <!-- FOOTER -->');
fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', content);
