const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Rebuilding sqlite3 properly on VPS...');

  const commands = `
    set -e
    cd /opt/my-website
    
    # Properly force a rebuild of sqlite3 from source
    npm rebuild sqlite3 --build-from-source
    
    # Restart the service
    sudo systemctl restart mywebsite
    
    sleep 2
    sudo systemctl status mywebsite --no-pager || true
    echo "✅ sqlite3 rebuilt and service restarted!"
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
