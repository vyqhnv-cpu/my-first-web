const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready: Uploading MCP files...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const localDir = path.resolve(__dirname, '../../mcp');
    const remoteDir = '/opt/my-website/mcp';
    
    const uploadFile = (localFile, remoteFile) => {
      return new Promise((resolve, reject) => {
        sftp.fastPut(localFile, remoteFile, (err) => {
          if (err) reject(err);
          else {
            console.log(`Uploaded ${localFile} -> ${remoteFile}`);
            resolve();
          }
        });
      });
    };

    // Create remote dir if not exists using exec
    conn.exec(`mkdir -p ${remoteDir}`, async (err, stream) => {
      if (err) throw err;
      
      stream.on('close', async () => {
        try {
          await uploadFile(path.join(localDir, 'mcp_server.js'), `${remoteDir}/mcp_server.js`);
          await uploadFile(path.join(localDir, 'tools.js'), `${remoteDir}/tools.js`);
          await uploadFile(path.resolve(__dirname, '../../server.js'), '/opt/my-website/server.js');
          
          console.log("Files uploaded. Restarting service...");
          
          conn.exec('sudo systemctl restart mywebsite', (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
              console.log("✅ MCP files deployed and service restarted!");
              conn.end();
            }).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
          });
          
        } catch (e) {
          console.error("Upload failed", e);
          conn.end();
        }
      });
    });
  });
}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
