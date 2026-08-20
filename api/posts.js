const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const postsPath = path.join(process.cwd(), 'public', 'data', 'posts.json');
    const data = fs.readFileSync(postsPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return res.status(200).send(data);
  } catch (err) {
    console.error('API posts error:', err);
    return res.status(500).json({ error: 'Failed to read posts' });
  }
};
