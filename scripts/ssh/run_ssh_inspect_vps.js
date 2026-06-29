const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    echo "--- PM2 Apps ---"
    pm2 status || true
    echo "--- Web Directory ---"
    ls -la /opt/my-first-web || ls -la /var/www/my-first-web || ls -la /root/my-first-web || true
    echo "--- GoClaw config ---"
    docker compose -f /opt/goclaw/docker-compose.yml exec goclaw ./goclaw mcp list || true
  `;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
