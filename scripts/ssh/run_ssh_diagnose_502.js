const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Checking systemd service and logs...');

  const commands = `
    set -e
    echo "--- 1. Checking listening ports ---"
    sudo ss -tlnp | grep 3000 || echo "Port 3000 not listening"
    
    echo "--- 2. Checking mywebsite service status ---"
    sudo systemctl status mywebsite --no-pager || true
    
    echo "--- 3. Checking recent logs for mywebsite ---"
    sudo journalctl -u mywebsite -n 20 --no-pager || true
    
    echo "--- 4. Checking Nginx error log ---"
    sudo tail -n 20 /var/log/nginx/error.log || true
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
