const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`sqlite3 /opt/my-website/my-brain/brain.db "SELECT * FROM enrollments;"`, (err, stream) => {
    stream.on('close', () => {
      conn.end();
    }).on('data', (d) => console.log(d.toString()))
      .stderr.on('data', (d) => console.error(d.toString()));
  });
}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
