const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH ready: Restarting goClaw with correct docker-compose files...');
  
  const commands = `
    set -e
    cd /opt/goclaw
    
    # Start using both base and postgres compose files
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --remove-orphans
    
    echo "Checking docker containers status..."
    sleep 3
    docker ps
  `;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
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
