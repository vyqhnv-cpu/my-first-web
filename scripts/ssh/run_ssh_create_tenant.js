const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    cd /opt/goclaw
    # Create the workspace user and grant permissions
    echo "Creating admin user..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "INSERT INTO tenants (id, name, created_at, updated_at) VALUES ('tenant-1', 'Admin Tenant', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
    
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "INSERT INTO users (id, tenant_id, username, role, created_at, updated_at) VALUES ('user-1', 'tenant-1', 'admin', 'admin', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"

    # Add default tenant mapping to env
    echo "GOCLAW_DEFAULT_TENANT_ID=tenant-1" >> .env
    
    echo "Restarting service..."
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
