const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    cd /opt/goclaw
    echo "Checking tenants in db..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "SELECT id, name FROM tenants;"
    
    echo "Updating user to the correct tenant..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "
      INSERT INTO tenant_users (tenant_id, user_id, display_name, role, created_at, updated_at)
      VALUES ('0193a5b0-7000-7000-8000-000000000001', '9c4e1b98-1b7b-4862-9ffa-439e812943e1', 'Admin', 'owner', NOW(), NOW())
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner';
    "
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
