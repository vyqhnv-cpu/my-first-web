const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Checking systemd...');

  const commands = `
    set -e
    cd /opt/my-website
    sed -i "s/app.listen(PORT, () => {/app.listen(PORT, '0.0.0.0', () => {/" server.js || true
    
    sudo systemctl restart mywebsite
    sleep 2
    
    ss -tlnp | grep 3000 || true
    systemctl status mywebsite --no-pager || true
    curl -I http://localhost:3000 || echo "Curl failed"
    echo "✅ Status checked"
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
