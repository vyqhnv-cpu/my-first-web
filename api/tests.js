const { supabase } = require('../lib/supabase');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

module.exports = () => {
  const router = require('express').Router();

  // GET: Lấy danh sách bài test
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase.from('tests').select('*');
      if (error) {
        if (error.code === '42P01') { // Fallback if table doesn't exist
          return res.json([
            { id: 1, name: 'Trắc nghiệm tính cách MBTI' },
            { id: 2, name: 'Định hướng nghề nghiệp Holland' }
          ]);
        }
        return res.status(500).json({ error: error.message });
      }
      res.json(data);
    } catch (err) {
      return res.json([
        { id: 1, name: 'Trắc nghiệm tính cách MBTI' },
        { id: 2, name: 'Định hướng nghề nghiệp Holland' }
      ]);
    }
  });

  // POST: Chấm điểm bài test (Demo)
  router.post('/submit', async (req, res) => {
    const { test_id, answers } = req.body;
    
    // Tại đây sẽ chứa logic tính toán điểm dựa trên mảng câu trả lời
    // Hiện tại ta trả về kết quả cứng để frontend hiển thị
    res.json({ 
      success: true, 
      result: 'ENFP', 
      summary: 'Người Truyền Cảm Hứng' 
    });
  });

  // POST: Ghi nhận form nhận tư vấn 1:1
  router.post('/lead', async (req, res) => {
    const { test_id, result, full_name, age, phone, email, aspect, details } = req.body;
    
    let dbData = null;
    try {
      const { data, error } = await supabase.from('test_leads').insert({
        test_id,
        result,
        full_name,
        age,
        phone,
        email,
        aspect,
        details,
        created_at: new Date().toISOString()
      }).select('id').single();

      if (error && error.code !== '42P01') {
        return res.status(500).json({ error: error.message });
      }
      dbData = data;
    } catch (err) {
      console.log('Supabase not configured, skipping DB insert for test_leads');
    }
    
    // Gửi email xác nhận đăng ký tư vấn
    if (email) {
      try {
        const isTestMode = email.includes('+test');
        const final_to_email = isTestMode ? email.replace('+test', '') : email;
        
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: final_to_email,
          subject: `Xác nhận đăng ký tư vấn Giải mã 1:1 thành công! 🌟`,
          html: `
            <p>Chào <strong>${full_name}</strong>,</p>
            <p>The LifeSkill Hub đã nhận được thông tin đăng ký tư vấn Giải mã chuyên sâu 1:1 của bạn.</p>
            <p>Hệ thống ghi nhận kết quả bài test của bạn là: <strong>${result}</strong>.</p>
            <p>Chúng tôi đã ghi chú lại việc bạn muốn ưu tiên tư vấn về khía cạnh: <em>"${aspect}"</em>.</p>
            <p>Chuyên gia của The LifeSkill Hub sẽ sớm liên hệ với bạn qua số Zalo (<strong>${phone}</strong>) để sắp xếp lịch hẹn phù hợp nhé.</p>
            <p>Thương mến,<br><strong>The LifeSkill Hub</strong></p>
          `
        });
      } catch (err) {
        console.error("Test Lead Registration Email Error:", err);
      }
    }
    
    res.json({ success: true, lead_id: dbData ? dbData.id : 'mock_id_for_testing' });
  });

  return router;
};
