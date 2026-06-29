const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Installing missing dependencies on VPS...');

  const commands = `
    cd /opt/my-website
    npm install dotenv @supabase/supabase-js
    sudo systemctl restart mywebsite
    
    echo "--- Checking service logs after restart ---"
    sleep 2
    sudo journalctl -u mywebsite -n 10 --no-pager
    
    echo "✅ Missing packages installed!"
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
