module.exports = async (req, res) => {
  // Cấu hình các headers CORS để cho phép gọi từ localhost lúc phát triển
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { account_number, amount_in } = req.query;

  // Bảo mật Token: Token nằm ở backend Vercel, khách truy cập trang web sẽ không bao giờ nhìn thấy!
  const sepayApiToken = "ID0HAQKQBSD63I4GHORCNY2A1XJPXU39A2ELRTMEDX4PWTKUQBCGI6OYCW8DPJLB";

  if (!account_number || !amount_in) {
    return res.status(400).json({ error: 'Missing parameters account_number or amount_in' });
  }

  const url = `https://my.sepay.vn/userapi/transactions/list?account_number=${account_number}&limit=10&amount_in=${amount_in}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${sepayApiToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from SePay' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
