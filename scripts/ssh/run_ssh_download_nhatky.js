const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  const commands = `
    cat /opt/my-website/my-brain/nhat_ky.md
  `;

  let fileContent = '';

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const localPath = path.join(__dirname, '../../my-brain/nhat_ky.md');
      fs.writeFileSync(localPath, fileContent, 'utf8');
      console.log('✅ Downloaded nhat_ky.md to local my-brain folder!');
      conn.end();
    })
    .on('data', d => fileContent += d.toString())
    .stderr.on('data', d => process.stderr.write(d));
  });

}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
