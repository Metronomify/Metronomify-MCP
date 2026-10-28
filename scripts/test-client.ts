import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function runTest() {
  console.log("🔍 Connecting to Metronomify MCP Server at http://localhost:3001/v1/sse ...");
  
  const transport = new SSEClientTransport(new URL("http://localhost:3001/v1/sse"));
  const client = new Client(
    {
      name: "metronomify-test-client",
      version: "1.0.0"
    },
    {
      capabilities: {}
    }
  );

  await client.connect(transport);
  console.log("✅ Connected and initialized successfully via MCP SSE!");

  // 1. List tools
  console.log("\n📋 Listing available tools from MCP server:");
  const toolsResponse = await client.listTools();
  for (const tool of toolsResponse.tools) {
    console.log(` - 🛠️  ${tool.name}: ${tool.description?.slice(0, 75)}...`);
  }

  // 2. Call tool: create_metronome_sync_room (24 BPM, 4 beats - exactly like user requested!)
  console.log("\n🧪 Testing Tool: create_metronome_sync_room (bpm: 24, beat: 4)");
  const roomResult = await client.callTool({
    name: "create_metronome_sync_room",
    arguments: { bpm: 24, beat: 4 }
  });
  console.log("Room Result:", JSON.stringify(roomResult, null, 2));

  // 3. Call tool: setup_metronome (120 BPM, 4/4)
  console.log("\n🧪 Testing Tool: setup_metronome (bpm: 120, beat: 4)");
  const metronomeResult = await client.callTool({
    name: "setup_metronome",
    arguments: { bpm: 120, beat: 4, start: true }
  });
  console.log("Metronome Result:", JSON.stringify(metronomeResult, null, 2));

  // 4. Call tool: setup_tuner
  console.log("\n🧪 Testing Tool: setup_tuner (instrument: guitar_standard, a4: 440)");
  const tunerResult = await client.callTool({
    name: "setup_tuner",
    arguments: { instrument: "guitar_standard", a4FrequencyHz: 440 }
  });
  console.log("Tuner Result:", JSON.stringify(tunerResult, null, 2));

  console.log("\n🎉 All MCP tool tests passed successfully!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
