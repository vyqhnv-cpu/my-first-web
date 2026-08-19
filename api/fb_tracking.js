const crypto = require('crypto');

// Hàm băm dữ liệu theo chuẩn SHA256 của Facebook
function hash(val) {
  if (!val) return null;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

function getClientIp(req) {
  return req.headers['cf-connecting-ip'] || 
         (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
         req.headers['x-real-ip'] || 
         req.socket?.remoteAddress || 
         req.ip;
}

function getClientUserAgent(req) {
  return req.headers['user-agent'] || '';
}

module.exports = () => {
  const router = require('express').Router();

  // Endpoint cung cấp Cấu hình cho Frontend (Ẩn CAPI Token, chỉ lộ Pixel ID)
  router.get('/config', (req, res) => {
    res.json({
      pixelId: process.env.FB_PIXEL_ID && process.env.FB_PIXEL_ID !== 'undefined' ? process.env.FB_PIXEL_ID : '863353330129564'
    });
  });

  // Endpoint nhận Event từ Frontend và bắn qua CAPI
  router.post('/track', async (req, res) => {
    try {
      const { event_name, event_id, event_source_url, fbp, fbc, custom_data, user_data } = req.body;

      const pixelId = (process.env.FB_PIXEL_ID && process.env.FB_PIXEL_ID !== 'undefined') ? process.env.FB_PIXEL_ID : '863353330129564';
      const capiToken = (process.env.FB_CAPI_TOKEN && process.env.FB_CAPI_TOKEN !== 'undefined') ? process.env.FB_CAPI_TOKEN : 'EAAeHwAZCIZCs8BSU2AZBd2QetKXqyWDAZBl52TrSebsabEx2kUv0sgjjQLzvZAKFINnHZBIp3ASaQt2iMTtDreKbHzFuHufCh7qpfJroiOaj4nFdTnvo80ZC0rZCOZA9q2ihcKZCD4KEs0IhSMBFRW4Pzox23TV2dofemgVm24eduIke6Kfop7hSLRKgLeCexqEYnEgwZDZD';

      if (!pixelId || !capiToken) {
        console.warn('[CAPI] FB_PIXEL_ID or FB_CAPI_TOKEN is not configured.');
        return res.status(200).json({ success: false, message: 'CAPI not configured' });
      }

      const clientIp = getClientIp(req);
      const userAgent = getClientUserAgent(req);

      // Format payload theo cấu trúc Facebook Graph API v21.0
      const payload = {
        data: [{
          event_name: event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id, // Quan trọng: Phải GIỐNG hệt Frontend để Facebook deduplicate
          event_source_url: event_source_url || req.headers.referer,
          action_source: 'website',
          user_data: {
            client_ip_address: clientIp, // RAW, NOT HASHED
            client_user_agent: userAgent, // RAW, NOT HASHED
            fbp: fbp || undefined, // RAW, NOT HASHED
            fbc: fbc || undefined, // RAW, NOT HASHED
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
      
      console.log('[CAPI] Final Payload to Meta:', JSON.stringify(payload, null, 2));

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
