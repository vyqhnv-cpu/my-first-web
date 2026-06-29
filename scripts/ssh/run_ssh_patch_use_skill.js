const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('🟢 SSH ready: patching use_skill.go and rebuilding...');
  
  const commands = `
    set -e
    cd /opt/goclaw
    
    # Backup file
    cp internal/tools/use_skill.go internal/tools/use_skill.go.bak
    
    # Write the patched use_skill.go file
    cat << 'EOF' > internal/tools/use_skill.go
package tools

import (
	"context"
	"fmt"
	"log/slog"
)

// UseSkillTool is a marker tool for observability.
// It generates tool.call / tool.result events in spans and realtime
// so skill activation is visible in tracing. The actual skill content
// is still loaded via read_file — this tool is a deliberate no-op.
type UseSkillTool struct{}

func NewUseSkillTool() *UseSkillTool { return &UseSkillTool{} }

func (t *UseSkillTool) Name() string { return "use_skill" }

func (t *UseSkillTool) Description() string {
	return "Activate a skill. Call this before read_file to signal skill usage for tracing and observability."
}

func (t *UseSkillTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"name": map[string]any{
				"type":        "string",
				"description": "Skill name or slug to activate",
			},
			"params": map[string]any{
				"type":                 "object",
				"description":          "Optional skill-specific parameters",
				"properties":           map[string]any{},
				"additionalProperties": false,
			},
		},
		"required": []string{"name"},
		"additionalProperties": false,
	}
}

func (t *UseSkillTool) Execute(_ context.Context, args map[string]any) *Result {
	name, _ := args["name"].(string)
	if name == "" {
		return ErrorResult("name parameter is required")
	}

	slog.Info("skill.activated", "skill", name)

	return NewResult(fmt.Sprintf("Skill %q activated. Proceed to read the skill's SKILL.md with read_file.", name))
}
EOF

    echo "✅ Patched use_skill.go on VPS"
    
    # Rebuild the goclaw image
    echo "Rebuilding Docker image..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml build goclaw
    
    # Restart compose
    echo "Restarting containers..."
    docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --remove-orphans
    
    echo "Checking docker containers status..."
    sleep 3
    docker ps
  `;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
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
