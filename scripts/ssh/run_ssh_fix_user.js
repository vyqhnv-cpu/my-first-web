const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    cd /opt/goclaw
    # Map the user's actual ID to the tenant
    echo "Updating user tenant..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "INSERT INTO users (id, tenant_id, username, role, created_at, updated_at) VALUES ('0accdd48-b1af-4762-849e-89288cf997ca', 'tenant-1', 'admin', 'admin', NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET tenant_id = 'tenant-1', role = 'admin';"
  `;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '149.28.133.221',
  port: 22,
  username: 'root',
  password: '6s(Eq%rW.Y4Xo7}d'
});
