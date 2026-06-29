const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = `
    echo "Running setup..."
    apt update && apt install docker.io docker-compose-plugin git curl -y
    mkdir -p /opt/goclaw
    cd /opt
    if [ ! -d "goclaw/.git" ]; then
      git clone -b main https://github.com/nextlevelbuilder/goclaw.git
    fi
    cd goclaw
    chmod +x prepare-env.sh
    ./prepare-env.sh
    
    # generate ssh key for github actions if not exists
    if [ ! -f ~/.ssh/github_actions_key ]; then
      ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key -N ""
      cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
      chmod 600 ~/.ssh/authorized_keys
    fi
    
    echo "==== SSH PRIVATE KEY ===="
    cat ~/.ssh/github_actions_key
    echo "==== END ===="
  `;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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
