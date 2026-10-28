import "dotenv/config";
import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMetronomifyMcpServer } from "./mcp-server.js";
import { renderMetronomeWidget } from "./ui/widget.js";
import { listActiveRooms } from "./tools/rooms.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=hu.wind.metronomify";

app.use(cors({ origin: "*" }));
app.use(express.json());

// Active SSE Transports indexed by sessionId
const activeTransports = new Map<string, SSEServerTransport>();

// Main MCP Server Factory
const server = createMetronomifyMcpServer();

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Metronomify MCP Server",
    platform: "Google Connected Apps & Gemini",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    activeRooms: listActiveRooms().length,
    activeSessions: activeTransports.size,
    timestamp: new Date().toISOString()
  });
});

// Interactive HTML5 / iFrame Widget for Gemini Connected Apps
app.get("/widget", async (req, res) => {
  const bpm = parseInt((req.query.bpm as string) || "120", 10);
  const beat = req.query.beat !== undefined ? parseInt(req.query.beat as string, 10) : 4;
  const room = (req.query.room as string) || undefined;
  const mode = (req.query.mode as any) || (room ? "sync" : "metronome");
  const tuning = (req.query.tuning as string) || "guitar_standard";
  const a4 = parseInt((req.query.a4 as string) || "440", 10);
  const title = (req.query.title as string) || "Új felvétel";

  const html = await renderMetronomeWidget({
    mode,
    bpm,
    beat,
    room,
    tuning,
    a4,
    title
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Web Redirector / Open Handoff page
// Opens app directly via deep link on Android, redirects to Play Store if not installed, or shows QR code on Desktop
app.get("/open", async (req, res) => {
  const target = (req.query.target as string) || "metronome";
  const bpm = req.query.bpm || "120";
  const beat = req.query.beat || req.query.beats || "4";
  const room = req.query.room || req.query.code || "";

  let deepLink = `metronomify://assistant/metronome?bpm=${bpm}&beats=${beat}&start=true`;
  if (target === "sync" || target === "host" || target === "room") {
    deepLink = `metronomify://host?room=${room}&bpm=${bpm}&beat=${beat}`;
  } else if (target === "join") {
    deepLink = `metronomify://join?room=${room}`;
  } else if (target === "tuner") {
    deepLink = `metronomify://assistant/tuner`;
  } else if (target === "recorder") {
    deepLink = `metronomify://assistant/recorder`;
  }

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(deepLink, { width: 280, margin: 1 });
  } catch (e) {
    console.error("QR Error:", e);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metronomify Megnyitása</title>
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #1e293b; border-radius: 24px; padding: 32px 24px; max-width: 420px; width: 100%; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h2 { margin: 0 0 8px; color: #ffffff; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 20px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #6366f1; color: white; padding: 14px 28px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 1.05rem; box-shadow: 0 4px 14px rgba(99,102,241,0.4); margin-bottom: 16px; }
    .btn:hover { background: #4f46e5; }
    .qr-box { background: white; border-radius: 16px; padding: 12px; display: inline-block; margin: 16px 0; }
    .play-link { color: #38bdf8; font-size: 0.85rem; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 3rem; margin-bottom: 12px;">🎵</div>
    <h2>Megnyitás a Metronomify-ban</h2>
    <p>A kért beállítások (BPM: <strong>${bpm}</strong>, Ütem: <strong>${beat}/4</strong>${room ? `, Szoba: <strong>${room}</strong>` : ''}) átadása folyamatban...</p>
    
    <div id="mobile-area">
      <a href="${deepLink}" class="btn" id="open-btn">Megnyitás az Appban</a>
      <div><a href="${PLAY_STORE_URL}" class="play-link" target="_blank">Alkalmazás letöltése a Google Play-ről</a></div>
    </div>

    <div id="desktop-area" style="display: none; margin-top: 10px;">
      <p style="font-size: 0.85rem; color: #cbd5e1;">Olvasd be a telefonoddal az app azonnali megnyitásához:</p>
      ${qrDataUrl ? `<div class="qr-box"><img src="${qrDataUrl}" width="240" height="240" alt="QR code"></div>` : ''}
    </div>
  </div>

  <script>
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deepLink = ${JSON.stringify(deepLink)};
    const playStore = ${JSON.stringify(PLAY_STORE_URL)};

    if (isMobile) {
      const start = Date.now();
      window.location.href = deepLink;
      setTimeout(() => {
        if (Date.now() - start < 1500) {
          window.location.href = playStore;
        }
      }, 1200);
    } else {
      document.getElementById('desktop-area').style.display = 'block';
    }
  </script>
</body>
</html>`);
});

// Tool Catalog endpoint for reviewers and documentation
app.get("/tools", (req, res) => {
  res.json({
    description: "Metronomify Model Context Protocol (MCP) Server for Gemini Connected Apps",
    category: "Music, podcasts, & audiobooks",
    organization: "WIND Kft.",
    capabilities: [
      {
        name: "create_metronome_sync_room",
        intent: "Real-time collaborative rehearsal room creation for musicians"
      },
      {
        name: "get_sync_room_status",
        intent: "Monitor tempo, playback state, and connected members"
      },
      {
        name: "update_room_tempo",
        intent: "Change BPM of connected rehearsal room live"
      },
      {
        name: "control_room_playback",
        intent: "Synchronized start / stop for all connected musician phones"
      },
      {
        name: "lookup_musical_tempo",
        intent: "Tempo markings (Allegro, Presto) and genre BPM guides"
      },
      {
        name: "calculate_beat_delays_and_subdivisions",
        intent: "Precise note values (triplets, dotted, 16ths) and audio delay ms"
      },
      {
        name: "get_instrument_tuning_reference",
        intent: "Metronomify Tuner frequencies (Hz) for Guitar, Bass, Ukulele, Strings"
      },
      {
        name: "generate_speed_trainer_routine",
        intent: "Step-by-step tempo escalation practice routine"
      },
      {
        name: "get_polyrhythm_guide",
        intent: "Polyrhythm instructions, counting, and mnemonic mnemonics"
      }
    ],
    endpoints: {
      sse: "/v1/sse",
      messages: "/v1/messages",
      widget: "/widget",
      open: "/open"
    }
  });
});

// SSE Connection Endpoint (MCP Client handshake)
app.get("/v1/sse", async (req, res) => {
  console.log(`[MCP SSE] Client connected from ${req.ip}`);

  try {
    const transport = new SSEServerTransport("/v1/messages", res);
    const sessionId = transport.sessionId;
    activeTransports.set(sessionId, transport);

    transport.onclose = () => {
      console.log(`[MCP SSE] Session closed: ${sessionId}`);
      activeTransports.delete(sessionId);
    };

    transport.onerror = (err) => {
      console.error(`[MCP SSE] Error in session ${sessionId}:`, err);
      activeTransports.delete(sessionId);
    };

    await server.connect(transport);
    await transport.start();
    console.log(`[MCP SSE] Initialized session: ${sessionId}`);
  } catch (error: any) {
    console.error("[MCP SSE] Connection error:", error);
    if (!res.headersSent) {
      res.status(500).send(`SSE Error: ${error.message}`);
    }
  }
});

// POST Message Endpoint (JSON-RPC requests from client)
app.post("/v1/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId query parameter" });
    return;
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: `Session not found: ${sessionId}` });
    return;
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (err: any) {
    console.error(`[MCP Messages] Error handling message for session ${sessionId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Landing Page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Metronomify MCP Server</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; background: #0f172a; color: #f8fafc; }
          a { color: #818cf8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code, pre { background: #1e293b; padding: 3px 6px; border-radius: 6px; font-family: monospace; }
          pre { padding: 16px; overflow-x: auto; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; background: #312e81; color: #c7d2fe; margin-right: 8px; }
          .card { background: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.08); }
        </style>
      </head>
      <body>
        <h1>🎵 Metronomify MCP Server</h1>
        <p><span class="badge">Google Connected Apps Ready</span> <span class="badge">MCP Protocol 2024-11-05</span></p>
        <p>This Model Context Protocol (MCP) server enables Google Gemini and other AI agents to manage synchronized rehearsal rooms, calculate tempo and delay timings, generate speed routines, and provide tuner pitch reference for musicians.</p>
        
        <div class="card">
          <h3>🔗 MCP Endpoints</h3>
          <ul>
            <li><strong>SSE Endpoint:</strong> <code>/v1/sse</code></li>
            <li><strong>Messages Endpoint:</strong> <code>/v1/messages</code></li>
            <li><strong>Interactive UI Widget (iFrames):</strong> <a href="/widget" target="_blank"><code>/widget</code></a></li>
            <li><strong>Handoff Open / QR Redirect:</strong> <a href="/open?target=metronome&bpm=120&beat=4" target="_blank"><code>/open</code></a></li>
            <li><strong>Tool Catalog:</strong> <a href="/tools"><code>/tools</code></a></li>
            <li><strong>Health Check:</strong> <a href="/health"><code>/health</code></a></li>
          </ul>
        </div>

        <div class="card">
          <h3>📱 Gemini Developer Mode Setup</h3>
          <p>To connect locally in the Gemini app:</p>
          <pre>URL: http://&lt;your-server-ip-or-tunnel&gt;:${PORT}/v1/sse</pre>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Metronomify MCP Server listening on port ${PORT}`);
  console.log(`📡 SSE Endpoint: http://localhost:${PORT}/v1/sse`);
  console.log(`🎨 iFrame Widget: http://localhost:${PORT}/widget`);
  console.log(`📲 App Open / QR: http://localhost:${PORT}/open`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`==================================================\n`);
});
