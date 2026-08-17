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
      title: 'Chương trình Đồng hành 1:1: Thinking Framework',
      category: 'TƯ DUY PHẢN BIỆN',
      category_class: 'ui-ux', // Keep class for purple badge styling
      price: 1500000,
      original_price: 2500000,
      sessions: '6 Buổi học 1:1',
      size_limit: 'Sĩ số 1 Học viên',
      badge: 'Khuyên dùng',
      image_url: 'asset/hero_student.png',
      description: 'Chương trình đồng hành cá nhân hóa giúp bạn bóc tách Sự thật (Fact) khỏi Cảm xúc (Feeling), nhận diện các ngụy biện, cơ chế phòng vệ tự xù lông và xây dựng Framework lập luận vững chắc để vượt qua hội chứng kẻ mạo danh và sự trì hoãn.',
      curriculum: [
        { title: 'Buổi 1: Nhận diện cảm xúc và Cơ chế phòng vệ tự xù lông', duration: '90 Phút' },
        { title: 'Buổi 2: Tách bạch Sự thật (Fact) khỏi Cảm xúc/Suy diễn', duration: '90 Phút' },
        { title: 'Buổi 3: Bẫy tư duy, Thiên kiến xác nhận và Nhận diện ngụy biện', duration: '90 Phút' },
        { title: 'Buổi 4: Đào sâu nguyên nhân gốc rễ (Root Cause Analysis - 5 Whys)', duration: '90 Phút' },
        { title: 'Buổi 5: Xây dựng lập luận có cấu trúc vững chắc (A-R-E)', duration: '90 Phút' },
        { title: 'Buổi 6: Capstone Project: Giải quyết một case study thực tế từ cuộc sống của bạn', duration: '90 Phút' }
      ]
    },
    {
      id: 2,
      title: 'Khai vấn 1:1: Giải mã bản thân (MBTI & Self-Awareness)',
      category: 'THẤU HIỂU NỘI TÂM',
      category_class: 'data-science', // Blue badge styling
      price: -1,
      original_price: null,
      sessions: '1 Buổi Zoom 1:1',
      size_limit: 'Sĩ số 1 Học viên',
      badge: 'Hot',
      image_url: 'asset/vn_mbti_self.png',
      description: 'Buổi nói chuyện giải mã chuyên sâu kết quả MBTI cá nhân của bạn. Nhận diện các nỗi sợ thầm kín, cơ chế đối phó khi căng thẳng và tìm kiếm sự công nhận phù hợp trong công việc và các mối quan hệ.',
      curriculum: [
        { title: 'Phần 1: Đối chiếu kết quả trắc nghiệm và hành vi thực tế hàng ngày', duration: '30 Phút' },
        { title: 'Phần 2: Chỉ ra các điểm mù trong giao tiếp và cơ chế phòng vệ ẩn', duration: '30 Phút' },
        { title: 'Phần 3: Xây dựng kế hoạch định vị giá trị cá nhân', duration: '30 Phút' }
      ]
    },
    {
      id: 3,
      title: 'Khai vấn 1:1: Định hướng sự nghiệp (Holland Career Match)',
      category: 'ĐỊNH HƯỚNG NGHỀ NGHIỆP',
      category_class: 'web-design', // Green badge styling
      price: -1,
      original_price: null,
      sessions: '1 Buổi Zoom 1:1',
      size_limit: 'Sĩ số 1 Học viên',
      badge: 'Mới',
      image_url: 'asset/vn_holland_career.png',
      description: 'Giải mã mật mã Holland để tìm ra sự giao thoa giữa sở thích tự nhiên và năng lực thực tế. Tháo gỡ trạng thái chênh vênh, đứng núi này trông núi nọ để chọn lựa ngành nghề phù hợp.',
      curriculum: [
        { title: 'Phần 1: Phân tích 3 nhóm mật mã Holland trội nhất của bạn', duration: '30 Phút' },
        { title: 'Phần 2: Khảo sát danh mục công việc thực tế tương thích trên thị trường', duration: '30 Phút' },
        { title: 'Phần 3: Lập kế hoạch rèn luyện các kỹ năng lõi để thăng tiến', duration: '30 Phút' }
      ]
    },
    {
      id: 99,
      title: 'Khóa học Tarot & Tâm lý học — Hiểu chính mình qua 22 lá Ẩn chính',
      category: 'TÂM LÝ HỌC',
      category_class: 'data-science', 
      price: 199000,
      original_price: 700000,
      sessions: '8 Buổi qua Zoom',
      size_limit: 'Khai giảng 24/8/2026',
      badge: 'Đặc biệt',
      image_url: 'asset/vn_talkshow_mindset.png',
      description: 'Khóa học Tarot & Tâm lý học 8 buổi Online. Giải mã 22 lá Ẩn chính dưới góc nhìn tâm lý học, hiểu vòng lặp suy nghĩ và hành vi của chính mình.',
      custom_url: '/khoa-hoc/tarot-va-tam-ly-hoc',
      curriculum: []
    }
  ];

  // Helper to merge DB data with mock fallbacks
  function mergeCourse(dbRow) {
    const fallback = mockCourses.find(c => c.id == dbRow.id) || mockCourses[0];
    
    // Chuẩn hóa category_class về các class CSS hợp lệ (ui-ux, data-science, web-design)
    let cleanClass = (dbRow.category_class || '').trim().toLowerCase();
    if (cleanClass.includes('tư-duy') || cleanClass.includes('tu-duy') || cleanClass.includes('tư-duy')) {
      cleanClass = 'ui-ux';
    } else if (cleanClass.includes('thấu hiểu') || cleanClass.includes('thau-hieu')) {
      cleanClass = 'data-science';
    } else if (cleanClass.includes('định hướng') || cleanClass.includes('dinh-huong') || cleanClass.includes('tâm lý')) {
      cleanClass = 'web-design';
    }
    
    if (!['ui-ux', 'data-science', 'web-design'].includes(cleanClass)) {
      cleanClass = fallback.category_class || 'ui-ux';
    }

    return {
      id: dbRow.id,
      title: dbRow.title || fallback.title,
      category: dbRow.category || fallback.category,
      category_class: cleanClass,
      price: dbRow.price !== undefined ? dbRow.price : fallback.price,
      original_price: dbRow.original_price !== undefined ? dbRow.original_price : fallback.original_price,
      sessions: dbRow.sessions || fallback.sessions,
      size_limit: dbRow.size_limit || fallback.size_limit,
      badge: dbRow.badge !== undefined ? dbRow.badge : fallback.badge,
      image_url: dbRow.image_url || fallback.image_url,
      description: dbRow.description || fallback.description,
      custom_url: dbRow.custom_url || fallback.custom_url,
      curriculum: dbRow.curriculum || fallback.curriculum
    };
  }

  let coursesCache = null;

  // GET: Lấy danh sách khóa học
  router.get('/', (req, res) => {
    const fetchFreshData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .abortSignal(controller.signal);
          
        clearTimeout(timeoutId);

        if (error || !data || data.length === 0) {
          coursesCache = mockCourses;
          return;
        }
        
        const merged = data.map(row => mergeCourse(row));
        
        // Merge missing custom courses like Tarot that might not be in DB
        const dbIds = new Set(merged.map(c => c.id));
        const extraLocal = mockCourses.filter(c => !dbIds.has(c.id));
        
        coursesCache = [...extraLocal, ...merged].sort((a, b) => a.id - b.id);
      } catch (err) {
        if (!coursesCache) coursesCache = mockCourses;
      }
    };

    if (coursesCache) {
      // Stale-while-revalidate: Trả kết quả ngay lập tức từ Cache, sau đó fetch ngầm
      res.json(coursesCache);
      fetchFreshData();
    } else {
      // Chưa có cache, trả luôn mockCourses cho nhanh, fetch ngầm cho lần sau
      res.json(mockCourses);
      fetchFreshData();
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
    const { course_id, full_name, email, phone, age } = req.body;
    
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
        age: age || null,
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
