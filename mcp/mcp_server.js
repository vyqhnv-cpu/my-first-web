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

const transports = new Map();

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
      const mcpServerInstance = new McpServer({
        name: "lifeskill-hub-mcp",
        version: "1.0.0",
      });
      registerTools(mcpServerInstance);

      const transport = new SSEServerTransport("/api/mcp/message", res);
      await mcpServerInstance.connect(transport);
      
      transports.set(transport.sessionId, transport);
      
      console.log(`[MCP] New SSE connection established, sessionId: ${transport.sessionId}`);
      
      // Cleanup on close
      res.on('close', () => {
        console.log(`[MCP] SSE connection closed, sessionId: ${transport.sessionId}`);
        transports.delete(transport.sessionId);
      });
    } catch (err) {
      console.error("[MCP] SSE connection error:", err);
      res.status(500).end();
    }
  });

  router.post('/message', async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports.get(sessionId);
    
    if (!transport) {
      console.warn(`[MCP] Message rejected: Session ${sessionId} not found.`);
      return res.status(400).json({ error: "Session not found" });
    }
    
    try {
      await transport.handlePostMessage(req, res);
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
