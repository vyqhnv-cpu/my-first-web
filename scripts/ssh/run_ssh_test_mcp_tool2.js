const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    cat << 'EOF' > /opt/my-website/test_mcp_tool2.js
const { registerTools } = require('./mcp/tools');
const mcpServer = {
  registerTool: (name, schema, handler) => {
    if (name === 'check_new_forms') {
      console.log('Testing check_new_forms...');
      handler({}).then(res => console.log(JSON.stringify(res, null, 2))).catch(err => console.error(err));
    }
  }
};
registerTools(mcpServer);
EOF
    cd /opt/my-website && node test_mcp_tool2.js
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
