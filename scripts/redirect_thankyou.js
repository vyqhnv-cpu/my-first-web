const fs = require('fs');

const tarotPath = 'public/khoa-hoc/tarot-va-tam-ly-hoc.html';
let content = fs.readFileSync(tarotPath, 'utf8');

const oldSuccessLogic = `                      // Gọi sự kiện Google Ads conversion
                      if (typeof gtag_report_conversion === 'function') {
                        gtag_report_conversion(); // Gọi không có tham số URL để không bị redirect
                      }
                    } catch(e) {}
                    msgBox.style.color = '#10B981';
                    msgBox.textContent = 'Ghi danh thành công! Đội ngũ tư vấn sẽ liên hệ với bạn trong 24h tới.';
                    this.reset();`;

const newSuccessLogic = `                      // Gọi sự kiện Google Ads conversion và chuyển hướng
                      if (typeof gtag_report_conversion === 'function') {
                        gtag_report_conversion('/thank-you.html'); 
                      } else {
                        window.location.href = '/thank-you.html';
                      }
                    } catch(e) {
                      window.location.href = '/thank-you.html';
                    }
                    msgBox.style.color = '#10B981';
                    msgBox.textContent = 'Đang chuyển hướng...';
                    this.reset();
                    // Fallback
                    setTimeout(() => window.location.href = '/thank-you.html', 1000);`;

if(content.includes(oldSuccessLogic)) {
  content = content.replace(oldSuccessLogic, newSuccessLogic);
  fs.writeFileSync(tarotPath, content);
  console.log('Updated tarot-va-tam-ly-hoc.html');
} else {
  console.log('Could not find exact block to replace in tarot-va-tam-ly-hoc.html');
}

// Let's also check public/courses.html just in case there's a registration form there.
// Or public/course-detail.html
