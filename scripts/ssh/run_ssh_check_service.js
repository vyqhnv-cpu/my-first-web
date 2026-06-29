const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Checking mywebsite service logs...');

  const commands = `
    set -e
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    sudo journalctl -u mywebsite -n 20 --no-pager || true
    sudo ss -tlnp | grep 3000 || echo "Not listening on 3000"
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
