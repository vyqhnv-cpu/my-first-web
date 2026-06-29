const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    cd /opt/goclaw
    echo "Updating tenant_users..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "INSERT INTO tenants (id, name, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000001', 'Admin Tenant', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
    
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "INSERT INTO tenant_users (tenant_id, user_id, display_name, role, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000001', '0accdd48-b1af-4762-849e-89288cf997ca', 'Admin', 'owner', NOW(), NOW()) ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner';"
    
    # Try adding to .env
    echo "GOCLAW_DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001" >> .env
    make up
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
