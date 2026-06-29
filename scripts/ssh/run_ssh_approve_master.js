const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    echo "Approving new pairing code WD58F66B..."
    cd /opt/goclaw
    # Approve the pairing
    OUTPUT=$(docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T goclaw ./goclaw pairing approve WD58F66B)
    echo "$OUTPUT"
    
    # Extract the new sender_id from the JSON output and update tenant
    echo "Updating user tenant for the new session..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml exec -T postgres psql -U goclaw -d goclaw -c "
      INSERT INTO tenant_users (tenant_id, user_id, display_name, role, created_at, updated_at)
      SELECT '0193a5b0-7000-7000-8000-000000000001', sender_id, 'Admin', 'owner', NOW(), NOW()
      FROM paired_devices
      ORDER BY paired_at DESC LIMIT 1
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
