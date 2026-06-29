const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    echo "--- alert_state.json ---"
    cat /opt/my-website/my-brain/alert_state.json || echo "File not found"
    
    echo "--- Recent MCP Server Logs ---"
    sudo journalctl -u mywebsite -n 100 --no-pager | grep -i "mcp\\|check_new_forms\\|error"
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
