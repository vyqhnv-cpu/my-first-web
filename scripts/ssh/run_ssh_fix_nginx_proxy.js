const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Fixing Nginx proxy_pass...');

  const commands = `
    set -e
    sudo sed -i 's/proxy_pass http:\\/\\/localhost:3000;/proxy_pass http:\\/\\/127.0.0.1:3000;/g' /etc/nginx/sites-available/thelifeskillhub.com
    sudo systemctl reload nginx
    echo "✅ Nginx proxy_pass fixed to 127.0.0.1!"
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
