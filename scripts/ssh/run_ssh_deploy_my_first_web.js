const { Client } = require('ssh2');

// Hard‑coded environment variables (from user input)
const env = {
  SUPABASE_URL: 'https://gpydibzaymuubtkthomb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweWRpYnpheW11dWJ0a3Rob21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDk3NDMsImV4cCI6MjA5NDAyNTc0M30.rADQpZtx_SvMdF-Y_e7epsSMp-0JO1WHQShqhlN6YDI',
  RESEND_API_KEY: 're_ai8V8rrn_FZ5eNi59m7HJ3NAnoAvvdyEL',
  ADMIN_USER: 'admin',
  ADMIN_PASSWORD: 'admin123',
  MCP_API_KEY: 'gX9kLm2Zt7pQr1Vb8wY4e0s3c6nD5fHj' // random key generated for MCP
};

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH connection ready');

  // Commands to run on the VPS
  const commands = `
    set -e
    # Create/enter directory
    sudo mkdir -p /opt/my-first-web
    sudo chown $(whoami):$(whoami) /opt/my-first-web
    cd /opt/my-first-web

    # Clone repo (or pull latest)
    if [ ! -d ".git" ]; then
      git clone https://github.com/vyqhnv-cpu/my-first-web.git .
    else
      git pull origin main
    fi

    # Install Node.js LTS if missing
    if ! command -v node > /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi

    # Install PM2 globally if missing
    if ! command -v pm2 > /dev/null; then
      sudo npm install -g pm2
    fi

    # Install project dependencies (using lockfile for speed)
    npm ci

    # Write .env file with provided values
    cat <<EOF > .env
SUPABASE_URL=${env.SUPABASE_URL}
SUPABASE_ANON_KEY=${env.SUPABASE_ANON_KEY}
RESEND_API_KEY=${env.RESEND_API_KEY}
ADMIN_USER=${env.ADMIN_USER}
ADMIN_PASSWORD=${env.ADMIN_PASSWORD}
MCP_API_KEY=${env.MCP_API_KEY}
EOF

    # Start / restart app with PM2
    pm2 start server.js --name my-first-web || pm2 restart my-first-web
    pm2 save
    pm2 startup systemd -u $(whoami) --hp $(echo $HOME)

    echo "✅ Deploy completed. Application listening on http://localhost:3000"
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
