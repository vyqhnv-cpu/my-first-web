const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const env = {
  SUPABASE_URL: 'https://gpydibzaymuubtkthomb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweWRpYnpheW11dWJ0a3Rob21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDk3NDMsImV4cCI6MjA5NDAyNTc0M30.rADQpZtx_SvMdF-Y_e7epsSMp-0JO1WHQShqhlN6YDI',
  RESEND_API_KEY: 're_ai8V8rrn_FZ5eNi59m7HJ3NAnoAvvdyEL',
  ADMIN_USER: 'admin',
  ADMIN_PASSWORD: 'admin123',
  MCP_API_KEY: 'gX9kLm2Zt7pQr1Vb8wY4e0s3c6nD5fHj'
};

const localDbPath = path.join(__dirname, '..', '..', 'my-brain', 'brain.db');
const remoteDbPath = '/opt/my-website/my-brain/brain.db';

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready');

  // 1. First batch of commands: clone, install, create .env, setup systemd
  const setupCmd = `
    set -e
    echo "--- 1. Setting up directory ---"
    sudo mkdir -p /opt/my-website
    sudo chown $(whoami):$(whoami) /opt/my-website
    cd /opt/my-website

    echo "--- 2. Cloning Repository ---"
    if [ ! -d ".git" ]; then
      git clone https://github.com/vyqhnv-cpu/my-first-web.git .
    else
      git pull origin main
    fi

    echo "--- 3. Installing Node.js LTS (if missing) ---"
    if ! command -v node > /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi

    echo "--- 4. Installing Dependencies ---"
    npm ci

    echo "--- 5. Creating .env file ---"
    cat <<EOF > .env
SUPABASE_URL=${env.SUPABASE_URL}
SUPABASE_ANON_KEY=${env.SUPABASE_ANON_KEY}
RESEND_API_KEY=${env.RESEND_API_KEY}
ADMIN_USER=${env.ADMIN_USER}
ADMIN_PASSWORD=${env.ADMIN_PASSWORD}
MCP_API_KEY=${env.MCP_API_KEY}
PORT=3000
EOF

    echo "--- 6. Setting up Systemd Service ---"
    sudo bash -c 'cat <<EOF > /etc/systemd/system/mywebsite.service
[Unit]
Description=My Website Node.js Service
After=network.target

[Service]
Environment=NODE_ENV=production
Type=simple
User=root
WorkingDirectory=/opt/my-website
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF'
    sudo systemctl daemon-reload
    sudo systemctl enable mywebsite

    echo "--- Setup commands completed ---"
  `;

  conn.exec(setupCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Setup commands finished. Now uploading brain.db via SFTP...');
      
      // 2. SFTP upload brain.db
      conn.sftp((err, sftp) => {
        if (err) {
          console.error('SFTP Error:', err);
          conn.end();
          return;
        }

        sftp.fastPut(localDbPath, remoteDbPath, (err) => {
          if (err) {
             console.error('SFTP Upload Error:', err);
             // Proceed anyway, maybe it doesn't exist locally
          } else {
             console.log('✅ brain.db uploaded successfully!');
          }

          // 3. Final commands: restart service, check status
          const finalCmd = `
            set -e
            echo "--- 7. Starting Service ---"
            sudo systemctl restart mywebsite
            sleep 2
            
            echo "--- 8. Verifying Service ---"
            systemctl status mywebsite --no-pager || true
            curl -I http://localhost:3000 || echo "Curl failed"
          `;
          
          conn.exec(finalCmd, (err, stream2) => {
             if (err) throw err;
             stream2.on('close', () => {
                console.log('✅ All done!');
                conn.end();
             })
             .on('data', d => process.stdout.write(d))
             .stderr.on('data', d => process.stderr.write(d));
          });
        });
      });
    })
    .on('data', d => process.stdout.write(d))
    .stderr.on('data', d => process.stderr.write(d));
  });

}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
