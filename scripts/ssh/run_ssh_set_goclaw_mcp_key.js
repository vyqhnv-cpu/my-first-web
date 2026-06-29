const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH ready to configure goClaw');
  const commands = `
    set -e
    cd /opt/goclaw
    # Ensure .env exists
    if [ ! -f .env ]; then echo 'Creating .env'; touch .env; fi
    # Remove any existing GOCLAW_GATEWAY_TOKEN line
    sed -i '/^GOCLAW_GATEWAY_TOKEN=/d' .env || true
    # Append new token (same as MCP_API_KEY used in my-first-web)
    echo "GOCLAW_GATEWAY_TOKEN=gX9kLm2Zt7pQr1Vb8wY4e0s3c6nD5fHj" >> .env
    echo "✅ GOCLAW_GATEWAY_TOKEN set in /opt/goclaw/.env"
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
