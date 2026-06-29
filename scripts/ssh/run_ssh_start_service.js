const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Starting mywebsite service...');

  const commands = `
    set -e
    
    echo "--- 1. Restarting mywebsite ---"
    sudo systemctl restart mywebsite
    
    echo "--- 2. Checking Status ---"
    sudo systemctl status mywebsite --no-pager || true
    
    echo "--- 3. Checking Port 3000 ---"
    sudo ss -tlnp | grep 3000 || echo "Not listening on 3000"
    
    echo "✅ Service restarted!"
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
