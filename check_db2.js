const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`ls -la /opt/my-website/my-brain/`, (err, stream) => {
    stream.on('close', () => {
      conn.end();
    }).on('data', (d) => process.stdout.write(d))
      .stderr.on('data', (d) => process.stderr.write(d));
  });
}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
