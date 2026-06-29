const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    cat << 'EOF' > /opt/my-website/test_mcp_list.js
const { registerTools } = require('./mcp/tools');
const mcpServer = {
  tools: [],
  registerTool: function(name, schema, handler) {
    this.tools.push(name);
  }
};
registerTools(mcpServer);
console.log("Registered tools:", mcpServer.tools);
EOF
    node /opt/my-website/test_mcp_list.js
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
