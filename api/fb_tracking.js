const crypto = require('crypto');

// Hàm băm dữ liệu theo chuẩn SHA256 của Facebook
function hash(val) {
  if (!val) return null;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

module.exports = () => {
  const router = require('express').Router();

  // Endpoint cung cấp Cấu hình cho Frontend (Ẩn CAPI Token, chỉ lộ Pixel ID)
  router.get('/config', (req, res) => {
    res.json({
      pixelId: process.env.FB_PIXEL_ID || 'MISSING_PIXEL_ID'
    });
  });

  // Endpoint nhận Event từ Frontend và bắn qua CAPI
  router.post('/track', async (req, res) => {
    try {
      const { event_name, event_id, event_source_url, fbp, fbc, custom_data, user_data } = req.body;

      const pixelId = process.env.FB_PIXEL_ID;
      const capiToken = process.env.FB_CAPI_TOKEN;

      if (!pixelId || !capiToken) {
        console.warn('[CAPI] FB_PIXEL_ID or FB_CAPI_TOKEN is not configured.');
        return res.status(200).json({ success: false, message: 'CAPI not configured' });
      }

      // Format payload theo cấu trúc Facebook Graph API v21.0
      const payload = {
        data: [{
          event_name: event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id, // Quan trọng: Phải GIỐNG hệt Frontend để Facebook deduplicate
          event_source_url: event_source_url || req.headers.referer,
          action_source: 'website',
          user_data: {
            client_ip_address: req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
            client_user_agent: req.headers['user-agent'],
            fbp: fbp,
            fbc: fbc,
            // Mã hóa PII (Personally Identifiable Information)
            em: user_data?.email ? [hash(user_data.email)] : [],
            ph: user_data?.phone ? [hash(user_data.phone)] : [],
          },
          custom_data: {
            value: custom_data?.value,
            currency: custom_data?.currency || 'VND',
            content_name: custom_data?.content_name
          }
        }],
      };

      const fbRes = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${capiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await fbRes.json();
      
      if (result.error) {
        console.error('[CAPI Error]:', result.error);
        return res.status(400).json(result);
      }

      res.json({ success: true, fb_response: result });
    } catch (err) {
      console.error('[CAPI Exception]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
