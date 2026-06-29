const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    echo "--- GoClaw files ---"
    ls -la /opt/goclaw
    echo "--- Agent Configs (if any) ---"
    ls -la /opt/goclaw/config || true
    cat /opt/goclaw/config/config.yaml || true
    cat /opt/goclaw/docker-compose.yml || true
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
