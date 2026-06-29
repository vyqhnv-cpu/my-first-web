const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    echo "=== Creating test script ==="
    cat << 'EOF' > /opt/my-website/test_mcp_daily.js
const { registerTools } = require('./mcp/tools');
const mcpServer = {
  registerTool: (name, schema, handler) => {
    if (name === 'check_daily_report') {
      console.log('Testing check_daily_report...');
      handler({}).then(res => console.log(JSON.stringify(res, null, 2))).catch(err => console.error(err));
    }
  }
};
registerTools(mcpServer);
EOF
    
    echo "=== Running test script ==="
    cd /opt/my-website && node test_mcp_daily.js
    
    echo "=== MCP Server Logs ==="
    sudo journalctl -u mywebsite -n 20 --no-pager | grep -i "mcp\\|error\\|check_daily_report"
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
