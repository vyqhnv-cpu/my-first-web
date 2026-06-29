const { supabase } = require('../lib/supabase');
const { Resend } = require('resend');

// Khởi tạo Resend bằng biến môi trường
const resendApiKey = process.env.RESEND_API_KEY || 'MISSING_API_KEY';
const resend = new Resend(resendApiKey);

module.exports = () => {
  const router = require('express').Router();

  // GET: Lấy danh sách khóa học
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        if (error.code === '42P01') {
          return res.json([
            { id: 1, title: 'Wireframing & Prototyping chuyên nghiệp', price: 499000, original_price: 800000, category: 'UX/UI DESIGN' }
          ]);
        }
        return res.status(500).json({ error: error.message });
      }
      res.json(data);
    } catch (err) {
      // Supabase chưa được cấu hình, trả về dữ liệu mẫu
      return res.json([
        { id: 1, title: 'Wireframing & Prototyping chuyên nghiệp', price: 499000, original_price: 800000, category: 'UX/UI DESIGN' }
      ]);
    }
  });

  // POST: Đăng ký khóa học
  router.post('/register', async (req, res) => {
    const { course_id, full_name, email, phone } = req.body;
    
    // Lấy thông tin giá khóa học từ CSDL (nếu có)
    let coursePrice = 0;
    try {
      const { data: courseData, error: courseError } = await supabase.from('courses').select('price').eq('id', course_id).single();
      if (!courseError && courseData) coursePrice = courseData.price;
    } catch(e) {}

    // ÉP GIÁ = 0 ĐỂ CHẠY CHƯƠNG TRÌNH KHUYẾN MÃI (Dạy miễn phí)
    // Sau này khi hết KM, bạn chỉ cần xóa dòng này và cập nhật giá > 0 trên Supabase
    coursePrice = 0; 

    const initialStatus = coursePrice === 0 ? 'paid' : 'pending';
    
    let dbData = null;
    try {
      // Lưu vào database
      const { data, error } = await supabase.from('enrollments').insert({
        course_id,
        full_name,
        email,
        phone,
        status: initialStatus,
        registered_at: new Date().toISOString()
      }).select('id').single();

      if (error && error.code !== '42P01') {
        return res.status(500).json({ error: error.message });
      }
      dbData = data;
    } catch (err) {
      console.log('Supabase not configured, skipping DB insert for enrollments');
    }
    
    if (coursePrice === 0) {
      // LUỒNG MIỄN PHÍ: Gửi email xác nhận ngay lập tức
      if (email) {
        try {
          const isTestMode = email.includes('+test');
          const final_to_email = isTestMode ? email.replace('+test', '') : email;
          
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: final_to_email,
            subject: `Xác nhận đăng ký khóa học thành công! 🎉`,
            html: `
              <p>Chào <strong>${full_name}</strong>,</p>
              <p>Chúc mừng bạn đã đăng ký thành công khóa học tại The LifeSkill Hub.</p>
              <p>Hệ thống đã ghi nhận thông tin của bạn. Vì đây là chương trình Miễn phí (Khuyến mãi đặc biệt), bạn không cần thanh toán thêm bất kỳ khoản nào.</p>
              <p>Vui lòng theo dõi email/zalo để nhận link tham gia lớp học qua Zoom nhé.</p>
              <p>Thương mến,<br><strong>The LifeSkill Hub</strong></p>
            `
          });
        } catch (err) {
          console.error("Course Registration Email Error:", err);
        }
      }
      return res.json({ success: true, payment_required: false, enrollment_id: dbData ? dbData.id : 'mock_id_for_testing' });
    } else {
      // LUỒNG CÓ PHÍ: KHÔNG gửi email ở bước này, yêu cầu chuyển sang trang thanh toán
      return res.json({ success: true, payment_required: true, enrollment_id: dbData ? dbData.id : 'mock_id_for_testing' });
    }
  });

  // POST: Xác nhận thanh toán (Dành cho luồng Có phí)
  router.post('/confirm-payment', async (req, res) => {
    const { enrollment_id, email, full_name } = req.body;
    
    let dbData = null;
    try {
      const { data, error } = await supabase.from('enrollments')
        .update({ status: 'awaiting_confirmation' })
        .eq('id', enrollment_id)
        .select('*')
        .single();
      
      if (!error && data) dbData = data;
    } catch (err) {
      console.log('Supabase update failed or missing config');
    }
    
    const targetEmail = (dbData && dbData.email) ? dbData.email : email;
    const targetName = (dbData && dbData.full_name) ? dbData.full_name : (full_name || 'Học viên');

    if (targetEmail) {
      try {
        const isTestMode = targetEmail.includes('+test');
        const final_to_email = isTestMode ? targetEmail.replace('+test', '') : targetEmail;
        
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: final_to_email,
          subject: `Đã ghi nhận yêu cầu xác nhận thanh toán! 💸`,
          html: `
            <p>Chào <strong>${targetName}</strong>,</p>
            <p>The LifeSkill Hub đã nhận được thông báo xác nhận chuyển khoản của bạn.</p>
            <p>Chúng tôi sẽ kiểm tra giao dịch và liên hệ lại với bạn qua Email/Zalo sớm nhất để gửi link tham gia lớp học Zoom.</p>
            <p>Cảm ơn bạn đã đồng hành cùng chúng tôi!</p>
            <p>Thương mến,<br><strong>The LifeSkill Hub</strong></p>
          `
        });
      } catch (err) {
        console.error("Payment Confirmation Email Error:", err);
      }
    }

    res.json({ success: true });
  });

  return router;
};
