const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    cd /opt/goclaw
    echo "Fixing permissions on /app/data..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T -u root goclaw chown -R goclaw:goclaw /app/data
    
    echo "Running onboard..."
    echo -e "\\n\\n\\n\\n\\n\\n" | docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T goclaw ./goclaw onboard
    
    echo "Restarting service..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml restart goclaw
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
