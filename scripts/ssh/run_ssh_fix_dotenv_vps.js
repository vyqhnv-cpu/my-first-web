const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Fixing dotenv bug on VPS...');

  const commands = `
    set -e
    cd /opt/my-website
    
    # Remove all require('dotenv').config() first
    sed -i "/require('dotenv').config()/d" server.js
    
    # Add require('dotenv').config() at the very top (after the first two comment lines)
    sed -i "3i require('dotenv').config();" server.js
    
    # Restart the service
    sudo systemctl restart mywebsite
    
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    echo "✅ Dotenv bug fixed!"
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
