const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    cd /opt/goclaw
    echo "Fixing permissions on host..."
    chown -R 1000:1000 data
    chown -R 1000:1000 skills
    chown -R 1000:1000 tsnet-state
    
    echo "Running onboard..."
    echo -e "\\n\\n\\n\\n\\n\\n" | docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T goclaw ./goclaw onboard
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
