const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Fast deploying static files...');

  const commands = `
    set -e
    cd /opt/my-website
    
    echo "--- 1. Fetching latest changes from GitHub ---"
    git fetch origin
    
    echo "--- 2. Resetting local workspace to match origin/main ---"
    git reset --hard origin/main
    git clean -fd
    
    echo "--- 3. Restarting Service ---"
    sudo systemctl restart mywebsite
    
    echo "✅ Fast deploy completed! Static assets and pages are updated on VPS."
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
