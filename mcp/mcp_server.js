const { registerTools } = require('./tools');

let McpServer;
let SSEServerTransport;

// We use dynamic imports because the MCP SDK is ESM
async function initMcp() {
  if (!McpServer || !SSEServerTransport) {
    const sdkMcp = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const sdkSse = await import('@modelcontextprotocol/sdk/server/sse.js');
    McpServer = sdkMcp.McpServer;
    SSEServerTransport = sdkSse.SSEServerTransport;
  }
}

// Keep a global transport reference (for a single gateway connection)
// If you need multiple concurrent connections, you might need a Map of sessionId -> transport
let globalTransport = null;
let mcpServerInstance = null;

async function setupMcpRouter(express) {
  await initMcp();
  const router = express.Router();

  // Middleware for basic API Key check (for security)
  router.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = process.env.MCP_API_KEY;
    
    // Only enforce API key check if it is set in env
    if (apiKey) {
      if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
      }
    }
    next();
  });

  router.get('/sse', async (req, res) => {
    try {
      // Disable Nginx buffering
      res.setHeader('X-Accel-Buffering', 'no');

      // Re-initialize the server to ensure a clean state per connection
      mcpServerInstance = new McpServer({
        name: "lifeskill-hub-mcp",
        version: "1.0.0",
      });
      registerTools(mcpServerInstance);

      globalTransport = new SSEServerTransport("/api/mcp/message", res);
      await mcpServerInstance.connect(globalTransport);
      
      console.log("[MCP] New SSE connection established");
    } catch (err) {
      console.error("[MCP] SSE connection error:", err);
      res.status(500).end();
    }
  });

  router.post('/message', async (req, res) => {
    if (!globalTransport) {
      return res.status(400).json({ error: "No active SSE connection" });
    }
    try {
      await globalTransport.handlePostMessage(req, res);
    } catch (err) {
      console.error("[MCP] Error handling message:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = {
  setupMcpRouter
};
