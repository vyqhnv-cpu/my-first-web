const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Checking Nginx logs for /api/public-donate...');

  const commands = `
    echo "--- NGINX ERROR LOG ---"
    sudo tail -n 20 /var/log/nginx/error.log
    echo "--- NGINX ACCESS LOG ---"
    sudo tail -n 50 /var/log/nginx/access.log | grep "/api/public-donate" || true
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
