const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH ready: updating env variables on VPS...');
  const openai_key = process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";
  const fb_page_id = process.env.FB_PAGE_ID || "YOUR_FB_PAGE_ID";
  const fb_page_token = process.env.FB_PAGE_TOKEN || "YOUR_FB_PAGE_TOKEN";
  
  const commands = `
    set -e
    cd /opt/goclaw
    
    # Backup current .env
    cp .env .env.bak
    
    # Remove existing definitions if any
    sed -i '/^OPENAI_API_KEY=/d' .env || true
    sed -i '/^FB_PAGE_ID=/d' .env || true
    sed -i '/^FB_PAGE_TOKEN=/d' .env || true
    
    # Append new variables
    echo "OPENAI_API_KEY=${openai_key}" >> .env
    echo "FB_PAGE_ID=${fb_page_id}" >> .env
    echo "FB_PAGE_TOKEN=${fb_page_token}" >> .env
    
    echo "✅ Environment variables updated in /opt/goclaw/.env"
    
    # Restart docker compose
    docker compose up -d
    echo "✅ Docker containers restarted successfully!"
  `;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    })
    .on('data', d => process.stdout.write(d))
    .stderr.on('data', d => process.stderr.write(d));
  });
}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
