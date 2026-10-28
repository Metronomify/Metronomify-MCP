import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function runTest() {
  console.log("🔍 Connecting to Metronomify MCP Server at http://localhost:3001/v1/sse ...");
  
  const transport = new SSEClientTransport(new URL("http://localhost:3001/v1/sse"));
  const client = new Client(
    {
      name: "metronomify-test-client",
      version: "2.0.0"
    },
    {
      capabilities: {}
    }
  );

  await client.connect(transport);
  console.log("✅ Connected successfully!");

  // 1. Setup Metronome (120 BPM, 4/4, speed acceleration ON)
  console.log("\n🧪 Testing Tool: setup_metronome");
  const metronomeRes = await client.callTool({
    name: "setup_metronome",
    arguments: {
      bpm: 120,
      beat: 4,
      rhythm: "QUARTER_NOTE",
      soundMode: "classic",
      accelEnabled: true,
      accelTargetBpm: 180,
      accelStepBpm: 5,
      accelIntervalSec: 10
    }
  });
  console.log("Metronome Result:", JSON.stringify(metronomeRes, null, 2));

  // 2. Create Sync Room (24 BPM, 4 beats)
  console.log("\n🧪 Testing Tool: create_metronome_sync_room (24 BPM, 4 beats)");
  const syncRes = await client.callTool({
    name: "create_metronome_sync_room",
    arguments: { bpm: 24, beat: 4 }
  });
  console.log("Sync Room Result:", JSON.stringify(syncRes, null, 2));

  // 3. Setup Tuner
  console.log("\n🧪 Testing Tool: setup_tuner (440Hz, Solfege, Flats)");
  const tunerRes = await client.callTool({
    name: "setup_tuner",
    arguments: {
      a4FrequencyHz: 440,
      namingSystem: "solfege",
      accidental: "flats",
      showOctave: true
    }
  });
  console.log("Tuner Result:", JSON.stringify(tunerRes, null, 2));

  // 4. Setup Recorder
  console.log("\n🧪 Testing Tool: setup_audio_recorder");
  const recorderRes = await client.callTool({
    name: "setup_audio_recorder",
    arguments: {}
  });
  console.log("Recorder Result:", JSON.stringify(recorderRes, null, 2));

  console.log("\n🎉 All tests passed!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
