const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Fixing Nginx SSE buffering bug on VPS...');

  const commands = `
    set -e
    cd /opt/my-website
    
    # Inject res.setHeader('X-Accel-Buffering', 'no'); into mcp/mcp_server.js
    sed -i "/router.get('\\/sse', async (req, res) => {/a \\      res.setHeader('X-Accel-Buffering', 'no');" mcp/mcp_server.js
    
    # Restart the service
    sudo systemctl restart mywebsite
    
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    echo "✅ SSE buffering bug fixed!"
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
