const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Uploading server.js to fix express.json() stream consumption bug...');

  const serverJsBase64 = fs.readFileSync(path.resolve(__dirname, '../../server.js')).toString('base64');

  const commands = `
    set -e
    echo "${serverJsBase64}" | base64 -d > /opt/my-website/server.js
    
    echo "--- Restarting Service ---"
    sudo systemctl restart mywebsite
    
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    echo "✅ server.js updated and service restarted!"
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
