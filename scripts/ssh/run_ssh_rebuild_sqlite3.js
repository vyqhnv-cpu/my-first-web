const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Rebuilding sqlite3 from source on VPS...');

  const commands = `
    set -e
    cd /opt/my-website
    
    # Install build tools just in case
    sudo apt-get update && sudo apt-get install -y build-essential python3
    
    # Rebuild sqlite3 from source
    npm install sqlite3 --build-from-source
    
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
