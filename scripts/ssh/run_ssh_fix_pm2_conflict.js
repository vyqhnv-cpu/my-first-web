const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Killing PM2 and restarting mywebsite...');

  const commands = `
    set -e
    echo "--- 1. Killing PM2 processes ---"
    if command -v pm2 > /dev/null; then
      pm2 kill || true
    fi
    pkill -f pm2 || true
    
    echo "--- 2. Updating server.js on the current repo ---"
    cd /opt/my-website
    sed -i "s/app.listen(PORT, () => {/app.listen(PORT, '0.0.0.0', () => {/" server.js || true

    echo "--- 3. Restarting mywebsite Systemd Service ---"
    sudo systemctl restart mywebsite
    sleep 2
    
    echo "--- 4. Checking Listening Ports ---"
    ss -tlnp | grep 3000 || true
    systemctl status mywebsite --no-pager || true
    
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
