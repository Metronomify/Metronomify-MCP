import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
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

// Serve static sounds if needed
app.use("/sounds", express.static(path.resolve("public/sounds")));

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

// Interactive HTML5 / iFrame Widget with Metronomify Native Design
app.get("/widget", async (req, res) => {
  const bpm = parseInt((req.query.bpm as string) || "120", 10);
  const beat = req.query.beat !== undefined ? parseInt(req.query.beat as string, 10) : 4;
  const room = (req.query.room as string) || undefined;
  const mode = (req.query.mode as any) || (room ? "sync" : "metronome");
  const rhythm = (req.query.rhythm as any) || "QUARTER_NOTE";
  const soundMode = (req.query.soundMode as any) || "classic";

  const accelEnabled = req.query.accelEnabled === "true";
  const accelTargetBpm = req.query.accelTargetBpm ? parseInt(req.query.accelTargetBpm as string, 10) : undefined;
  const accelStepBpm = req.query.accelStepBpm ? parseInt(req.query.accelStepBpm as string, 10) : undefined;
  const accelIntervalSec = req.query.accelIntervalSec ? parseInt(req.query.accelIntervalSec as string, 10) : undefined;

  // Tuner options
  const a4 = parseInt((req.query.a4 as string) || "440", 10);
  const namingSystem = (req.query.namingSystem as any) || (req.query.system as any) || "standard";
  const accidental = (req.query.accidental as any) || "sharps";
  const showOctave = req.query.showOctave !== "false" && req.query.octave !== "false";

  // Recorder options
  const title = (req.query.title as string) || "Új próba felvétel";

  const html = await renderMetronomeWidget({
    mode,
    bpm,
    beat,
    rhythm,
    soundMode,
    accelEnabled,
    accelTargetBpm,
    accelStepBpm,
    accelIntervalSec,
    room,
    a4,
    namingSystem,
    accidental,
    showOctave,
    title
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Web Redirector / Open Handoff page
app.get("/open", async (req, res) => {
  const target = (req.query.target as string) || "metronome";
  const bpm = req.query.bpm || "120";
  const beat = req.query.beat || req.query.beats || "4";
  const room = req.query.room || req.query.code || "";
  const pattern = req.query.pattern || "QUARTER_NOTE";

  let deepLink = `metronomify://assistant/metronome?bpm=${bpm}&beats=${beat}&pattern=${pattern}&start=true`;
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
    qrDataUrl = await QRCode.toDataURL(deepLink, { width: 280, margin: 1, color: { dark: "#1C1F2E", light: "#FFFFFF" } });
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { background: #141118; color: #FFFFFF; font-family: 'Montserrat', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #201F25; border-radius: 28px; padding: 32px 24px; max-width: 400px; width: 100%; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
    h2 { margin: 0 0 8px; color: #4169E1; font-weight: 800; }
    p { color: #AAAAAA; font-size: 0.9rem; line-height: 1.5; margin: 0 0 20px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #4169E1; color: white; padding: 14px 28px; border-radius: 28px; text-decoration: none; font-weight: 800; font-size: 1rem; box-shadow: 0 4px 14px rgba(65,105,225,0.4); margin-bottom: 14px; transition: transform 0.12s ease; }
    .btn:hover { transform: scale(0.97); }
    .btn:active { transform: scale(0.93); }
    .qr-box { background: white; border-radius: 20px; padding: 12px; display: inline-block; margin: 16px 0; }
    .play-link { color: #D0DDFE; font-size: 0.8rem; text-decoration: underline; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 3rem; margin-bottom: 12px;">⏱️</div>
    <h2>Metronomify</h2>
    <p>A kért beállítások átadása a telefonnak folyamatban...</p>
    
    <div id="mobile-area">
      <a href="${deepLink}" class="btn">Megnyitás az Appban</a>
      <div><a href="${PLAY_STORE_URL}" class="play-link" target="_blank">Letöltés a Google Play Áruházból</a></div>
    </div>

    <div id="desktop-area" style="display: none;">
      <p style="font-size: 0.85rem; color: #FFFFFF; margin-bottom: 8px;">Olvasd be a telefonoddal az app azonnali megnyitásához:</p>
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
        name: "setup_metronome",
        intent: "Full-featured metronome (15-500 BPM, all subdivisions, classic/modern sounds, speed acceleration, app handoff)"
      },
      {
        name: "create_metronome_sync_room",
        intent: "Synchronized rehearsal room parameter setup and 1-click app sync launch"
      },
      {
        name: "setup_tuner",
        intent: "Tuner options listing (A4 Hz, note naming system, sharps/flats, octave) with app handoff"
      },
      {
        name: "setup_audio_recorder",
        intent: "One-click studio audio recorder app handoff"
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

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Metronomify MCP Server listening on port ${PORT}`);
  console.log(`📡 SSE Endpoint: http://localhost:${PORT}/v1/sse`);
  console.log(`🎨 iFrame Widget: http://localhost:${PORT}/widget`);
  console.log(`📲 App Open / QR: http://localhost:${PORT}/open`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`==================================================\n`);
});
