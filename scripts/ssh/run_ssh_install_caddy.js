const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Installing and configuring Caddy...');

  const commands = `
    set -e
    echo "--- 1. Installing Caddy (if not exists) ---"
    if ! command -v caddy > /dev/null; then
      sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg || true
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
      sudo apt update
      sudo apt install -y caddy
    else
      echo "Caddy already installed."
    fi

    echo "--- 2. Configuring Firewall (Ports 80, 443) ---"
    if command -v ufw > /dev/null; then
      sudo ufw allow 80/tcp || true
      sudo ufw allow 443/tcp || true
    fi
    sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT || true
    sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT || true

    echo "--- 3. Creating Caddyfile ---"
    sudo bash -c 'cat <<EOF > /etc/caddy/Caddyfile
thelifeskillhub.com, www.thelifeskillhub.com {
    reverse_proxy localhost:3000
}

app.thelifeskillhub.com {
    reverse_proxy localhost:18790
}
EOF'

    echo "--- 4. Restarting Caddy ---"
    sudo systemctl restart caddy
    sudo systemctl enable caddy
    
    echo "--- 5. Checking Caddy Status ---"
    systemctl status caddy --no-pager || true
    
    echo "✅ Caddy setup completed successfully!"
  `;

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Connection closed.');
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
