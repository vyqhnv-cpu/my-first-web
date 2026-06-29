const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH ready: set GOCLAW_GATEWAY_TOKEN & restart goClaw');
  const commands = `
    set -e
    cd /opt/goclaw
    # Ensure .env exists
    if [ ! -f .env ]; then echo 'Creating .env'; touch .env; fi
    # Update token (same as MCP key used in my-first-web)
    sed -i '/^GOCLAW_GATEWAY_TOKEN=/d' .env || true
    echo "GOCLAW_GATEWAY_TOKEN=gX9kLm2Zt7pQr1Vb8wY4e0s3c6nD5fHj" >> .env
    echo "✅ Updated GOCLAW_GATEWAY_TOKEN in .env"
    # Restart goClaw container (docker compose)
    docker compose -f docker-compose.yml up -d --remove-orphans
    echo "✅ goClaw containers restarted"
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
