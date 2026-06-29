const { supabase } = require('../lib/supabase');
const { Resend } = require('resend');

// Khởi tạo Resend bằng biến môi trường
const resendApiKey = process.env.RESEND_API_KEY || 'MISSING_API_KEY';
const resend = new Resend(resendApiKey);

module.exports = () => {
  const router = require('express').Router();

  const mockCourses = [
    {
      id: 1,
      title: 'Wireframing & Prototyping chuyên nghiệp',
      category: 'UX/UI DESIGN',
      category_class: 'ui-ux',
      price: 499000,
      original_price: 800000,
      sessions: '16 Buổi Zoom',
      size_limit: '20 Học viên/Lớp',
      badge: 'Đăng ký nhiều',
      image_url: 'asset/teacher_female.png',
      description: 'Khóa học Wireframing & Prototyping chuyên nghiệp được thiết kế đặc biệt cho những bạn muốn nắm vững các công cụ và tư duy thiết kế UX/UI. Tham gia lớp học trực tiếp qua Zoom, bạn sẽ được tương tác 1:1 với giảng viên, chữa bài thực hành ngay tại lớp. Bạn không chỉ học cách sử dụng công cụ (như Figma), mà còn học cách tư duy logic đằng sau mỗi quyết định thiết kế, từ đó tự tin tạo ra các sản phẩm thực tế để đưa vào Portfolio xin việc.',
      curriculum: [
        { title: 'Buổi 1-4: Nền tảng tư duy UX và Wireframing', duration: '4 Buổi' },
        { title: 'Buổi 5-8: Làm chủ công cụ Figma & Hệ thống UI Component', duration: '4 Buổi' },
        { title: 'Buổi 9-12: Prototyping cơ bản đến nâng cao (Animation/Micro-interactions)', duration: '4 Buổi' },
        { title: 'Buổi 13-16: Đồ án cuối khóa & Chữa Portfolio', duration: '4 Buổi' }
      ]
    },
    {
      id: 2,
      title: 'Python Cho Khoa Học Dữ Liệu Cơ Bản',
      category: 'DATA SCIENCE',
      category_class: 'data-science',
      price: 599000,
      original_price: null,
      sessions: '22 Buổi Zoom',
      size_limit: '15 Học viên/Lớp',
      badge: '',
      image_url: 'asset/hero_student.png',
      description: 'Khóa học Python Cho Khoa Học Dữ Liệu Cơ Bản cung cấp nền tảng lập trình và phân tích dữ liệu thực tế bằng Python. Bạn sẽ làm quen với cú pháp, xử lý mảng, vẽ biểu đồ và trực quan hoá dữ liệu, giúp bạn tự tin ứng dụng vào công việc phân tích báo cáo.',
      curriculum: [
        { title: 'Buổi 1-6: Cú pháp Python cơ bản & Biến số', duration: '6 Buổi' },
        { title: 'Buổi 7-12: Xử lý dữ liệu với Pandas & Numpy', duration: '6 Buổi' },
        { title: 'Buổi 13-18: Trực quan hóa dữ liệu với Matplotlib & Seaborn', duration: '6 Buổi' },
        { title: 'Buổi 19-22: Bài tập lớn & Ứng dụng thực tế', duration: '4 Buổi' }
      ]
    }
  ];

  // Helper to merge DB data with mock fallbacks
  function mergeCourse(dbRow) {
    const fallback = mockCourses.find(c => c.id == dbRow.id) || mockCourses[0];
    return {
      id: dbRow.id,
      title: dbRow.title || fallback.title,
      category: dbRow.category || fallback.category,
      category_class: dbRow.category_class || fallback.category_class || 'ui-ux',
      price: dbRow.price !== undefined ? dbRow.price : fallback.price,
      original_price: dbRow.original_price !== undefined ? dbRow.original_price : fallback.original_price,
      sessions: dbRow.sessions || fallback.sessions,
      size_limit: dbRow.size_limit || fallback.size_limit,
      badge: dbRow.badge !== undefined ? dbRow.badge : fallback.badge,
      image_url: dbRow.image_url || fallback.image_url,
      description: dbRow.description || fallback.description,
      curriculum: dbRow.curriculum || fallback.curriculum
    };
  }

  // GET: Lấy danh sách khóa học
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        // Trở về mock data nếu bảng chưa có trên DB
        return res.json(mockCourses);
      }
      // Khớp dữ liệu từ DB với cấu trúc chi tiết
      const merged = data.map(row => mergeCourse(row));
      res.json(merged.length ? merged : mockCourses);
    } catch (err) {
      return res.json(mockCourses);
    }
  });

  // GET: Lấy chi tiết 1 khóa học
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
      if (error) {
        const mock = mockCourses.find(c => c.id == id);
        if (mock) return res.json(mock);
        return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      }
      res.json(mergeCourse(data));
    } catch (err) {
      const mock = mockCourses.find(c => c.id == id);
      if (mock) return res.json(mock);
      return res.status(500).json({ error: err.message });
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
