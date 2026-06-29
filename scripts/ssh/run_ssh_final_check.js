const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    echo "=== Service Status ==="
    sudo systemctl status mywebsite --no-pager | grep Active
    
    echo "=== Creating test script ==="
    cat << 'EOF' > /opt/my-website/test_mcp_final.js
const { registerTools } = require('./mcp/tools');
const mcpServer = {
  registerTool: (name, schema, handler) => {
    if (name === 'check_new_forms' || name === 'check_daily_report') {
      console.log(\`Testing \${name}...\`);
      handler({}).then(res => console.log(name, 'Result:', JSON.stringify(res, null, 2))).catch(err => console.error(name, 'Error:', err));
    }
  }
};
registerTools(mcpServer);
EOF
    
    echo "=== Running test script ==="
    cd /opt/my-website && node test_mcp_final.js
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
