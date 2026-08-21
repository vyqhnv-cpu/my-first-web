const fs = require('fs');
let content = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');

// The block to replace
const oldArticle1 = `          <!-- Article 1 -->
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
          </article>`;

const newArticle1 = `          <!-- Article 1 -->
          <article class="article-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <div class="article-img-box" style="position: relative; padding-top: 56.25%;">
              <span class="article-badge" style="position: absolute; top: 1rem; left: 1rem; background: var(--color-primary); color: white; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 2;">Sự nghiệp</span>
              <img src="/asset/blog_hybrid.png" alt="Kỹ năng giao tiếp" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            </div>
            <div class="article-body" style="padding: 1.5rem;">
              <h3 class="article-card-title" style="margin-bottom: 0.75rem; font-size: 1.25rem;">
                <a href="/blog/giao-tiep-moi-truong-hybrid.html" style="color: var(--color-primary); text-decoration: none;">Kỹ năng giao tiếp: Chìa khóa thành công môi trường Hybrid</a>
              </h3>
              <p class="article-card-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                Khi làm việc từ xa trở thành bình thường mới, cách chúng ta truyền đạt ý tưởng cần được tinh chỉnh để đạt hiệu quả tối ưu và gắn kết đội ngũ.
              </p>
              <div class="article-card-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="article-date" style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">10 Tháng 5, 2026</span>
                <a href="/blog/giao-tiep-moi-truong-hybrid.html" style="color: var(--color-accent); font-weight: 600; font-size: 0.9rem; text-decoration: none;">Đọc tiếp &rarr;</a>
              </div>
            </div>
          </article>`;

content = content.replace(oldArticle1, newArticle1);
fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', content);
