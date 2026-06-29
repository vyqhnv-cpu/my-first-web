const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    cat /opt/my-website/.env || echo ".env not found"
    echo "--- Supabase config ---"
    cat /opt/my-website/lib/supabase.js
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
