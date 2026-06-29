const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    echo "Fixing CPU limit in docker-compose..."
    cd /opt/goclaw
    # Remove cpu limits from docker-compose files just to be safe
    sed -i '/cpus:/d' docker-compose.yml docker-compose.postgres.yml compose.d/*.yml || true
    
    echo "Starting Docker Compose again..."
    make up
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
