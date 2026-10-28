import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMetronomifyMcpServer } from "./mcp-server.js";

async function runStdio() {
  const server = createMetronomifyMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Metronomify MCP server running on stdio");
}

runStdio().catch((error) => {
  console.error("Fatal error running stdio server:", error);
  process.exit(1);
});
