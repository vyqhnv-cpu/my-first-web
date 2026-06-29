const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Configuring Nginx...');

  const commands = `
    set -e
    
    echo "--- 1. Stopping and Disabling Caddy ---"
    sudo systemctl stop caddy || true
    sudo systemctl disable caddy || true
    
    echo "--- 2. Installing Certbot ---"
    sudo apt-get update -y
    sudo apt-get install -y certbot python3-certbot-nginx
    
    echo "--- 3. Creating Nginx Configs ---"
    
    # 3.1 Website Config (Port 3000)
    sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/mywebsite
server {
    listen 80;
    server_name thelifeskillhub.com www.thelifeskillhub.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        
        # SSE Support
        proxy_set_header Connection '';
        proxy_cache off;
        proxy_buffering off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400;
    }
}
EOF'

    # 3.2 GoClaw Config (Port 18790)
    sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/goclaw
server {
    listen 80;
    server_name app.thelifeskillhub.com;

    location / {
        proxy_pass http://localhost:18790;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
EOF'

    echo "--- 4. Enabling Configs ---"
    sudo ln -sf /etc/nginx/sites-available/mywebsite /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/goclaw /etc/nginx/sites-enabled/
    
    # Remove default Nginx config if it conflicts
    sudo rm -f /etc/nginx/sites-enabled/default

    echo "--- 5. Testing Nginx & Reloading ---"
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "--- 6. Running Certbot for SSL ---"
    # We use --non-interactive and agree-tos
    # We will attempt to get certificates for both domains
    sudo certbot --nginx --non-interactive --agree-tos --email admin@thelifeskillhub.com -d thelifeskillhub.com -d www.thelifeskillhub.com || echo "Certbot warning (maybe DNS not propagated yet)"
    sudo certbot --nginx --non-interactive --agree-tos --email admin@thelifeskillhub.com -d app.thelifeskillhub.com || echo "Certbot warning (maybe DNS not propagated yet)"
    
    echo "✅ Nginx Configuration Completed!"
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
