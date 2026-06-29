const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Fixing Nginx config...');

  // Using base64 to avoid all escaping issues in bash
  const mywebsiteConf = `
server {
    listen 80;
    server_name thelifeskillhub.com www.thelifeskillhub.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE specific
        proxy_cache off;
        proxy_buffering off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400;
    }
}
`.trim();

  const goclawConf = `
server {
    listen 80;
    server_name app.thelifeskillhub.com;

    location / {
        proxy_pass http://localhost:18790;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`.trim();

  const mywebsiteB64 = Buffer.from(mywebsiteConf).toString('base64');
  const goclawB64 = Buffer.from(goclawConf).toString('base64');

  const commands = `
    set -e
    
    echo "--- 1. Rewriting Nginx Configs ---"
    echo "${mywebsiteB64}" | base64 -d | sudo tee /etc/nginx/sites-available/mywebsite > /dev/null
    echo "${goclawB64}" | base64 -d | sudo tee /etc/nginx/sites-available/goclaw > /dev/null

    echo "--- 2. Testing Nginx & Reloading ---"
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "--- 3. Running Certbot for SSL ---"
    sudo certbot --nginx --non-interactive --agree-tos --email admin@thelifeskillhub.com -d thelifeskillhub.com -d www.thelifeskillhub.com || echo "Certbot failed for thelifeskillhub.com"
    sudo certbot --nginx --non-interactive --agree-tos --email admin@thelifeskillhub.com -d app.thelifeskillhub.com || echo "Certbot failed for app.thelifeskillhub.com"
    
    echo "✅ Nginx Fix Completed!"
  `;

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', d => process.stdout.write(d))
    .stderr.on('data', d => process.stderr.write(d));
  });

}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
