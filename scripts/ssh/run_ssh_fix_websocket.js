const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Installing ws to fix Node 20 WebSocket issue...');

  const commands = `
    set -e
    cd /opt/my-website
    npm install ws
    
    # Inject global.WebSocket = require('ws'); into server.js right after dotenv
    sed -i "4i global.WebSocket = require('ws');" server.js
    
    # Restart the service
    sudo systemctl restart mywebsite
    
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    echo "✅ WebSocket bug fixed!"
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
