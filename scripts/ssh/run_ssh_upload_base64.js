const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Uploading files via Base64...');

  const serverJsBase64 = fs.readFileSync(path.resolve(__dirname, '../../server.js')).toString('base64');
  const mcpServerBase64 = fs.readFileSync(path.resolve(__dirname, '../../mcp/mcp_server.js')).toString('base64');
  const toolsBase64 = fs.readFileSync(path.resolve(__dirname, '../../mcp/tools.js')).toString('base64');

  const commands = `
    set -e
    mkdir -p /opt/my-website/mcp
    
    echo "${serverJsBase64}" | base64 -d > /opt/my-website/server.js
    echo "${mcpServerBase64}" | base64 -d > /opt/my-website/mcp/mcp_server.js
    echo "${toolsBase64}" | base64 -d > /opt/my-website/mcp/tools.js
    
    echo "--- Restarting Service ---"
    sudo systemctl restart mywebsite
    
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    echo "✅ Files uploaded and service restarted!"
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
