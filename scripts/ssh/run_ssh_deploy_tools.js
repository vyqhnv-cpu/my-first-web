const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Deploying tools.js...');

  const localFile = path.join(__dirname, '../../mcp/tools.js');
  const fileContent = fs.readFileSync(localFile, 'utf8');
  const base64Content = Buffer.from(fileContent).toString('base64');

  const commands = `
    echo "${base64Content}" | base64 -d > /opt/my-website/mcp/tools.js
    sudo systemctl restart mywebsite
    echo "✅ tools.js updated and service restarted!"
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
