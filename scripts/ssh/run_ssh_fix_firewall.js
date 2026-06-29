const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Fixing firewall and bindings...');

  const commands = `
    set -e
    echo "--- 1. Opening Port 3000 in UFW/iptables ---"
    if command -v ufw > /dev/null; then
      sudo ufw allow 3000/tcp || true
    fi
    sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT || true

    echo "--- 2. Updating server.js to bind to 0.0.0.0 ---"
    cd /opt/my-website
    # Replace app.listen(PORT, ...) with app.listen(PORT, '0.0.0.0', ...)
    sed -i "s/app.listen(PORT, () => {/app.listen(PORT, '0.0.0.0', () => {/" server.js || true

    echo "--- 3. Restarting Service ---"
    sudo systemctl restart mywebsite
    
    echo "--- 4. Checking Listening Ports ---"
    ss -tlnp | grep 3000 || true
    
    echo "✅ Fix applied!"
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
