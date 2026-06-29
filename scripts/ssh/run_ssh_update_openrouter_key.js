const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH ready: updating GOCLAW_OPENROUTER_API_KEY on VPS...');
  const or_key = process.env.GOCLAW_OPENROUTER_API_KEY || "YOUR_GOCLAW_OPENROUTER_API_KEY";
  
  const commands = `
    set -e
    cd /opt/goclaw
    
    # Backup current .env
    cp .env .env.bak2
    
    # Remove existing definitions if any
    sed -i '/^GOCLAW_OPENROUTER_API_KEY=/d' .env || true
    
    # Append the key
    echo "GOCLAW_OPENROUTER_API_KEY=${or_key}" >> .env
    
    echo "✅ GOCLAW_OPENROUTER_API_KEY updated in /opt/goclaw/.env"
    
    # Restart docker compose with correct files
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --remove-orphans
    echo "✅ Docker containers restarted successfully!"
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
