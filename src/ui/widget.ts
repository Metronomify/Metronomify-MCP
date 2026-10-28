import QRCode from "qrcode";
import { EMBEDDED_SOUNDS } from "./sounds.js";

export interface WidgetOptions {
  mode?: "metronome" | "sync" | "tuner" | "recorder";
  bpm?: number;
  beat?: number;
  rhythm?: "QUARTER_NOTE" | "EIGHTH_NOTES" | "TRIPLET" | "SIXTEENTH_NOTES" | "DOTTED_EIGHTH" | "QUARTER_TWO_EIGHTHS";
  soundMode?: "classic" | "modern";
  accelEnabled?: boolean;
  accelTargetBpm?: number;
  accelStepBpm?: number;
  accelIntervalSec?: number;
  room?: string;
  // Tuner params
  a4?: number;
  namingSystem?: "standard" | "solfege" | "german";
  accidental?: "sharps" | "flats";
  showOctave?: boolean;
  // Recorder params
  title?: string;
}

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=hu.wind.metronomify";

export async function renderMetronomeWidget(options: WidgetOptions = {}): Promise<string> {
  const mode = options.mode || (options.room ? "sync" : "metronome");
  const bpm = Math.max(15, Math.min(500, options.bpm || 120));
  const beat = options.beat !== undefined ? Math.max(0, Math.min(16, options.beat)) : 4;
  const rhythm = options.rhythm || "QUARTER_NOTE";
  const soundMode = options.soundMode || "classic";
  const room = options.room || "463216";

  const accelEnabled = Boolean(options.accelEnabled);
  const accelTargetBpm = Math.max(bpm + 5, Math.min(500, options.accelTargetBpm || (bpm + 40)));
  const accelStepBpm = options.accelStepBpm || 5;
  const accelIntervalSec = options.accelIntervalSec || 10;

  // Tuner options
  const a4 = options.a4 || 440;
  const namingSystem = options.namingSystem || "standard";
  const accidental = options.accidental || "sharps";
  const showOctave = options.showOctave !== undefined ? options.showOctave : true;

  // Build the deep link
  let deepLink = "metronomify://assistant";
  if (mode === "sync") {
    deepLink = `metronomify://host?room=${room}&bpm=${bpm}&beat=${beat}`;
  } else if (mode === "tuner") {
    deepLink = `metronomify://assistant/tuner?a4=${a4}&system=${namingSystem}&accidental=${accidental}&octave=${showOctave}`;
  } else if (mode === "recorder") {
    deepLink = `metronomify://assistant/recorder`;
  } else {
    deepLink = `metronomify://assistant/metronome?bpm=${bpm}&beats=${beat}&pattern=${rhythm}&start=true`;
  }

  // QR Code for Desktop users
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(deepLink, {
      width: 260,
      margin: 1,
      color: { dark: "#1C1F2E", light: "#FFFFFF" }
    });
  } catch (err) {
    console.error("QR Error:", err);
  }

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metronomify</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --blue: #4169E1;
      --blue-darker: #4141E1;
      --light-blue: #D0DDFE;
      --bg: #FFF7FE;
      --surface: #FFFFFF;
      --text: #1C1F2E;
      --text-muted: #75808F;
      --pill-container: #EAEFFC;
      --pill-ripple: #D0DDFE;
      --card-stroke: rgba(65, 105, 225, 0.15);
      --green: #4CAF50;
      --red: #E53935;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #141118;
        --surface: #201F25;
        --text: #FFFFFF;
        --text-muted: #AAAAAA;
        --pill-container: #2E2D35;
        --pill-ripple: #4169E1;
        --card-stroke: rgba(255, 255, 255, 0.08);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 12px;
    }

    .app-card {
      background: var(--surface);
      border-radius: 28px;
      padding: 20px 22px;
      width: 100%;
      max-width: 390px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
      border: 1px solid var(--card-stroke);
      position: relative;
    }

    /* Top Brand & Header */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--blue);
      letter-spacing: -0.3px;
    }

    .mode-badge {
      background: var(--pill-container);
      color: var(--blue);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    /* Buttons & Interactive Pill Style with Compression Hover Animation */
    button, .pill-btn, .action-btn {
      border: none;
      outline: none;
      cursor: pointer;
      font-family: inherit;
      font-weight: 700;
      transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s ease, opacity 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }

    button:hover, .pill-btn:hover, .action-btn:hover {
      transform: scale(0.97);
    }

    button:active, .pill-btn:active, .action-btn:active {
      transform: scale(0.92);
    }

    .btn-blue {
      background: var(--blue);
      color: #FFFFFF;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 0.85rem;
    }

    .btn-pill-toggle {
      background: var(--pill-container);
      color: var(--text);
      border-radius: 24px;
      padding: 7px 14px;
      font-size: 0.8rem;
    }

    .btn-pill-toggle.active {
      background: var(--blue);
      color: #FFFFFF;
    }

    /* Primary Handoff Button (Megnyitás a Metronomify-ban) */
    .handoff-container {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid var(--card-stroke);
      text-align: center;
    }

    .btn-handoff {
      width: 100%;
      background: var(--blue);
      color: #FFFFFF;
      border-radius: 26px;
      padding: 13px 20px;
      font-size: 0.95rem;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(65, 105, 225, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
    }

    .playstore-subtext {
      display: inline-block;
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 600;
      text-decoration: underline;
    }

    /* ========================================================= */
    /* 1. SYNC SZIKLA-EGYSZERŰ PARAMÉTER NÉZET                   */
    /* ========================================================= */
    .sync-card {
      text-align: center;
      padding: 12px 6px;
    }

    .sync-room-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #FEE2E2;
      color: #DC2626;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }

    @media (prefers-color-scheme: dark) {
      .sync-room-pill {
        background: #450A0A;
        color: #F87171;
      }
    }

    .sync-params-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .param-box {
      background: var(--pill-container);
      border-radius: 18px;
      padding: 14px 10px;
    }

    .param-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }

    .param-value {
      font-size: 1.8rem;
      font-weight: 900;
      color: var(--blue);
      margin-top: 2px;
    }

    /* ========================================================= */
    /* 2. TUNER TISZTA LISTÁZÓ NÉZET                             */
    /* ========================================================= */
    .tuner-card {
      padding: 8px 4px;
    }

    .tuner-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }

    .tuner-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--pill-container);
      border-radius: 16px;
      padding: 12px 16px;
    }

    .tuner-row-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .tuner-row-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--blue);
    }

    /* ========================================================= */
    /* 3. RECORDER NÉZET                                         */
    /* ========================================================= */
    .recorder-card {
      text-align: center;
      padding: 24px 8px;
    }

    .recorder-icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #FEE2E2;
      color: #DC2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      margin: 0 auto 14px;
    }

    @media (prefers-color-scheme: dark) {
      .recorder-icon-circle {
        background: #450A0A;
        color: #EF4444;
      }
    }

    /* ========================================================= */
    /* 4. TELJES, VALÓDI METRONÓM NÉZET                          */
    /* ========================================================= */
    .metronome-top-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      margin-bottom: 6px;
    }

    .step-buttons-col {
      display: flex;
      gap: 6px;
    }

    .btn-step-large {
      width: 44px;
      height: 78px;
      background: var(--blue);
      color: #FFFFFF;
      font-size: 2.2rem;
      font-weight: 800;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .center-bpm-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .note-equals-row {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text);
    }

    .bpm-display-num {
      font-size: 3.8rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -1.5px;
      color: var(--text);
      cursor: pointer;
    }

    .tempo-name-text {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text-muted);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tap-tempo-btn {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      background: var(--blue);
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      box-shadow: 0 4px 14px rgba(65, 105, 225, 0.3);
    }

    .tap-tempo-icon { font-size: 1.3rem; }
    .tap-tempo-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Slider (15 - 500 BPM) */
    .slider-wrap {
      margin: 14px 0 12px;
      position: relative;
    }

    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: var(--light-blue);
      height: 6px;
      border-radius: 4px;
      outline: none;
    }

    @media (prefers-color-scheme: dark) {
      input[type=range] { background: #334155; }
    }

    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--blue);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    /* Sub-controls Pill bar (Beat, Rhythm, Sound Mode) */
    .subcontrols-bar {
      display: flex;
      gap: 6px;
      justify-content: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    /* Big Center Visualizer & Play Button */
    .visualizer-container {
      position: relative;
      background: var(--pill-container);
      border-radius: 22px;
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .pulse-ring {
      position: absolute;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: var(--light-blue);
      opacity: 0;
      transform: scale(0.6);
      transition: all 0.08s ease-out;
      pointer-events: none;
    }

    .pulse-ring.active {
      opacity: 0.85;
      transform: scale(1.3);
    }

    .pulse-ring.accent.active {
      background: rgba(229, 57, 53, 0.45);
      transform: scale(1.4);
    }

    .btn-main-play {
      position: relative;
      z-index: 2;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--blue);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      box-shadow: 0 6px 18px rgba(65, 105, 225, 0.4);
    }

    .btn-main-play.playing {
      background: var(--red);
      box-shadow: 0 6px 18px rgba(229, 57, 53, 0.4);
    }

    /* Accelerate Pill Banner */
    .accel-pill-banner {
      display: none;
      align-items: center;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--card-stroke);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-radius: 20px;
      padding: 6px 14px;
      margin: 10px auto 4px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text);
      width: fit-content;
    }

    .accel-pill-banner.active {
      display: flex;
    }

    /* Modal for QR scanning on Desktop */
    .qr-overlay {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--surface);
      border-radius: 28px;
      padding: 24px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      text-align: center;
    }

    .qr-overlay.open { display: flex; }
    .qr-box-img {
      width: 190px;
      height: 190px;
      border-radius: 16px;
      padding: 8px;
      background: white;
      margin: 14px 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
  </style>
</head>
<body>
  <div class="app-card">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="brand-logo">
        <span>⏱️</span> Metronomify
      </div>
      <div class="mode-badge">${mode === 'sync' ? 'Sync Szoba' : mode === 'tuner' ? 'Hangoló' : mode === 'recorder' ? 'Felvevő' : 'Metronóm'}</div>
    </div>

    ${mode === 'sync' ? `
      <!-- ================= 1. SYNC SZIKLA-EGYSZERŰ NÉZET ================= -->
      <div class="sync-card">
        <div class="sync-room-pill">
          <span>●</span> Szobakód: <strong>${room}</strong>
        </div>

        <div class="sync-params-grid">
          <div class="param-box">
            <div class="param-label">Tempó</div>
            <div class="param-value">${bpm} <span style="font-size: 0.85rem; font-weight:700;">BPM</span></div>
          </div>
          <div class="param-box">
            <div class="param-label">Ütem</div>
            <div class="param-value">${beat > 0 ? beat + '/4' : 'Nincs'}</div>
          </div>
        </div>

        <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 6px;">
          Közös próbaszoba zenekaroknak. Kattints az alábbi gombra a szoba indításához a telefonodon.
        </div>
      </div>
    ` : mode === 'tuner' ? `
      <!-- ================= 2. TUNER LISTÁZÓ NÉZET ================= -->
      <div class="tuner-card">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text); margin-bottom: 12px; text-align: center;">
          Hangoló beállítások előkészítve:
        </div>
        <div class="tuner-list">
          <div class="tuner-row">
            <span class="tuner-row-label">A4 Referencia:</span>
            <span class="tuner-row-val">${a4} Hz</span>
          </div>
          <div class="tuner-row">
            <span class="tuner-row-label">Hangjegyrendszer:</span>
            <span class="tuner-row-val">${namingSystem === 'solfege' ? 'Szolmizáció (Do Re Mi)' : namingSystem === 'german' ? 'Német (C D E F G A H)' : 'Standard (C D E F G A B)'}</span>
          </div>
          <div class="tuner-row">
            <span class="tuner-row-label">Módosító előjegyzés:</span>
            <span class="tuner-row-val">${accidental === 'flats' ? 'Bék (b / Flats)' : 'Keresztek (# / Sharps)'}</span>
          </div>
          <div class="tuner-row">
            <span class="tuner-row-label">Oktávszám:</span>
            <span class="tuner-row-val">${showOctave ? 'Kijelezve' : 'Rejtve'}</span>
          </div>
        </div>
      </div>
    ` : mode === 'recorder' ? `
      <!-- ================= 3. RECORDER NÉZET ================= -->
      <div class="recorder-card">
        <div class="recorder-icon-circle">🎙️</div>
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--text); margin-bottom: 4px;">Metronomify Hangrögzítő</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
          Stúdió minőségű próbafelvétel készítése mikrofonnal az Android appban.
        </div>
      </div>
    ` : `
      <!-- ================= 4. TELJES METRONÓM NÉZET ================= -->
      <div class="metronome-top-controls">
        <div class="step-buttons-col">
          <button class="btn-step-large" id="btn-minus">-</button>
          <button class="btn-step-large" id="btn-plus">+</button>
        </div>

        <div class="center-bpm-col">
          <div class="note-equals-row">
            <span>♩</span>
            <span>=</span>
          </div>
          <div class="bpm-display-num" id="bpm-val">${bpm}</div>
          <div class="tempo-name-text" id="tempo-label">Moderato</div>
        </div>

        <button class="tap-tempo-btn" id="btn-tap-tempo">
          <span class="tap-tempo-icon">🥁</span>
          <span class="tap-tempo-label">TAP</span>
        </button>
      </div>

      <!-- 15 - 500 BPM Slider -->
      <div class="slider-wrap">
        <input type="range" id="bpm-slider" min="15" max="500" value="${bpm}">
      </div>

      <!-- Subcontrols: Beat, Rhythm, Sound Mode, Accelerate -->
      <div class="subcontrols-bar">
        <button class="btn-pill-toggle" id="btn-beat">Ütem: ${beat > 0 ? beat + '/4' : '0'}</button>
        <button class="btn-pill-toggle" id="btn-rhythm">Ritmus: ♩</button>
        <button class="btn-pill-toggle" id="btn-sound">${soundMode === 'modern' ? 'Fa' : 'Klasszikus'}</button>
        <button class="btn-pill-toggle ${accelEnabled ? 'active' : ''}" id="btn-accel">Gyorsítás: ${accelEnabled ? 'BE' : 'KI'}</button>
      </div>

      <!-- Big Center Play / Visualizer -->
      <div class="visualizer-container">
        <div class="pulse-ring" id="pulse-ring"></div>
        <button class="btn-main-play" id="btn-main-play">▶</button>
      </div>

      <!-- Accelerate Pill Banner (if active) -->
      <div class="accel-pill-banner ${accelEnabled ? 'active' : ''}" id="accel-banner">
        <span>⚡</span>
        <span id="accel-banner-text">${bpm} → ${accelTargetBpm} (+${accelStepBpm} / ${accelIntervalSec}mp)</span>
      </div>
    `}

    <!-- Primary Handoff Button (Megnyitás a Metronomify-ban) -->
    <div class="handoff-container">
      <button class="btn-handoff" id="btn-open-app">
        <span>📲</span>
        <span>
          ${mode === 'sync' ? 'Szoba indítása a Metronomify-ban' :
            mode === 'tuner' ? 'Hangoló megnyitása a Metronomify-ban' :
            mode === 'recorder' ? 'Felvevő megnyitása a Metronomify-ban' :
            'Megnyitás a Metronomify-ban'}
        </span>
      </button>
      <div>
        <a href="${PLAY_STORE_URL}" target="_blank" class="playstore-subtext">Nincs még meg az app? Google Play letöltés</a>
      </div>
    </div>

    <!-- QR Modal Overlay for Desktop Users -->
    <div class="qr-overlay" id="qr-overlay">
      <div style="font-weight: 800; font-size: 1.15rem; color: var(--text);">📲 Beolvasás telefonnal</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; max-width: 250px;">
        Olvasd be a kameráddal vagy a Metronomify appal, és azonnal megnyílik a telefonodon!
      </div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" class="qr-box-img">` : ''}
      <button class="btn-blue" id="btn-close-qr" style="margin-top: 4px;">Bezárás</button>
    </div>
  </div>

  <script>
    // Embedded Sounds 1:1 from Metronomify Android app
    const SOUNDS = ${JSON.stringify(EMBEDDED_SOUNDS)};
    const deepLinkBase = ${JSON.stringify(deepLink)};
    const playStoreUrl = ${JSON.stringify(PLAY_STORE_URL)};

    let bpm = ${bpm};
    let beat = ${beat};
    let rhythmMode = "${rhythm}";
    let soundMode = "${soundMode}";
    let accelEnabled = ${accelEnabled};
    let accelTargetBpm = ${accelTargetBpm};
    let accelStepBpm = ${accelStepBpm};
    let accelIntervalSec = ${accelIntervalSec};

    let isPlaying = false;
    let timer = null;
    let currentBeat = 0;
    let currentSubBeat = 0;
    let accelTimer = null;

    // WebAudio initialization
    let audioCtx = null;
    const audioBuffers = {};

    async function loadAudioBuffer(name, dataUri) {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      try {
        const response = await fetch(dataUri);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[name] = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.warn("Audio decode failed for", name, e);
      }
    }

    // Preload audio
    window.addEventListener('DOMContentLoaded', () => {
      loadAudioBuffer('clickHi', SOUNDS.clickHi);
      loadAudioBuffer('clickLo', SOUNDS.clickLo);
      loadAudioBuffer('modernHi', SOUNDS.modernHi);
      loadAudioBuffer('modernLo', SOUNDS.modernLo);
    });

    function playSoundSample(isAccent) {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        loadAudioBuffer('clickHi', SOUNDS.clickHi);
        loadAudioBuffer('clickLo', SOUNDS.clickLo);
        loadAudioBuffer('modernHi', SOUNDS.modernHi);
        loadAudioBuffer('modernLo', SOUNDS.modernLo);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const key = soundMode === 'modern' 
        ? (isAccent ? 'modernHi' : 'modernLo')
        : (isAccent ? 'clickHi' : 'clickLo');

      const buf = audioBuffers[key];
      if (buf) {
        const source = audioCtx.createBufferSource();
        source.buffer = buf;
        source.connect(audioCtx.destination);
        source.start(0);
      } else {
        // Synthesis fallback if buffer not ready
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = isAccent ? 1200 : 800;
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      }

      // Visual pulse
      const ring = document.getElementById('pulse-ring');
      if (ring) {
        ring.className = 'pulse-ring' + (isAccent ? ' accent active' : ' active');
        setTimeout(() => ring.classList.remove('active'), 80);
      }
    }

    // Tempo markings
    function getTempoName(b) {
      if (b < 60) return 'Largo';
      if (b < 77) return 'Adagio';
      if (b < 108) return 'Andante';
      if (b < 120) return 'Moderato';
      if (b < 168) return 'Allegro';
      if (b < 200) return 'Presto';
      return 'Prestissimo';
    }

    function updateBpm(val) {
      bpm = Math.max(15, Math.min(500, val));
      const bpmVal = document.getElementById('bpm-val');
      const bpmSlider = document.getElementById('bpm-slider');
      const tempoLabel = document.getElementById('tempo-label');
      if (bpmVal) bpmVal.textContent = bpm;
      if (bpmSlider) bpmSlider.value = bpm;
      if (tempoLabel) tempoLabel.textContent = getTempoName(bpm);

      const bannerText = document.getElementById('accel-banner-text');
      if (bannerText) {
        bannerText.textContent = bpm + ' → ' + accelTargetBpm + ' (+' + accelStepBpm + ' / ' + accelIntervalSec + 'mp)';
      }

      if (isPlaying) {
        restartTimer();
      }
    }

    function tick() {
      const isAccent = (currentBeat === 0 && beat > 0);
      playSoundSample(isAccent);
      currentBeat = (currentBeat + 1) % (beat > 0 ? beat : 1);
    }

    function startMetronome() {
      isPlaying = true;
      const playBtn = document.getElementById('btn-main-play');
      if (playBtn) {
        playBtn.textContent = '⏸';
        playBtn.classList.add('playing');
      }
      currentBeat = 0;
      tick();
      const intervalMs = (60 / bpm) * 1000;
      timer = setInterval(tick, intervalMs);

      // Acceleration runner
      if (accelEnabled) {
        accelTimer = setInterval(() => {
          if (bpm + accelStepBpm <= accelTargetBpm) {
            updateBpm(bpm + accelStepBpm);
          } else {
            updateBpm(accelTargetBpm);
            clearInterval(accelTimer);
          }
        }, accelIntervalSec * 1000);
      }
    }

    function stopMetronome() {
      isPlaying = false;
      const playBtn = document.getElementById('btn-main-play');
      if (playBtn) {
        playBtn.textContent = '▶';
        playBtn.classList.remove('playing');
      }
      if (timer) clearInterval(timer);
      if (accelTimer) clearInterval(accelTimer);
      timer = null;
      accelTimer = null;
    }

    function restartTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, (60 / bpm) * 1000);
    }

    // Step +/- buttons
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    if (btnMinus) btnMinus.addEventListener('click', () => updateBpm(bpm - 1));
    if (btnPlus) btnPlus.addEventListener('click', () => updateBpm(bpm + 1));

    const slider = document.getElementById('bpm-slider');
    if (slider) slider.addEventListener('input', (e) => updateBpm(parseInt(e.target.value, 10)));

    const mainPlay = document.getElementById('btn-main-play');
    if (mainPlay) {
      mainPlay.addEventListener('click', () => {
        if (isPlaying) stopMetronome();
        else startMetronome();
      });
    }

    // Tap Tempo
    let tapTimes = [];
    const btnTap = document.getElementById('btn-tap-tempo');
    if (btnTap) {
      btnTap.addEventListener('click', () => {
        const now = Date.now();
        tapTimes.push(now);
        if (tapTimes.length > 4) tapTimes.shift();
        if (tapTimes.length >= 2) {
          let intervals = [];
          for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
          }
          const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const calculatedBpm = Math.round(60000 / avgMs);
          if (calculatedBpm >= 15 && calculatedBpm <= 500) {
            updateBpm(calculatedBpm);
          }
        }
      });
    }

    // Beat Selector Toggle
    const beatOptions = [0, 2, 3, 4, 5, 6, 7, 8];
    const btnBeat = document.getElementById('btn-beat');
    if (btnBeat) {
      btnBeat.addEventListener('click', () => {
        const nextIdx = (beatOptions.indexOf(beat) + 1) % beatOptions.length;
        beat = beatOptions[nextIdx];
        btnBeat.textContent = 'Ütem: ' + (beat > 0 ? beat + '/4' : '0');
        currentBeat = 0;
      });
    }

    // Rhythm Selector Toggle
    const rhythmList = [
      { id: "QUARTER_NOTE", label: "Ritmus: ♩" },
      { id: "EIGHTH_NOTES", label: "Ritmus: ♪♪" },
      { id: "TRIPLET", label: "Ritmus: 3-as" },
      { id: "SIXTEENTH_NOTES", label: "Ritmus: ♬" }
    ];
    let rhythmIdx = 0;
    const btnRhythm = document.getElementById('btn-rhythm');
    if (btnRhythm) {
      btnRhythm.addEventListener('click', () => {
        rhythmIdx = (rhythmIdx + 1) % rhythmList.length;
        rhythmMode = rhythmList[rhythmIdx].id;
        btnRhythm.textContent = rhythmList[rhythmIdx].label;
      });
    }

    // Sound Mode Toggle (Classic / Modern)
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        soundMode = soundMode === 'classic' ? 'modern' : 'classic';
        btnSound.textContent = soundMode === 'modern' ? 'Fa' : 'Klasszikus';
      });
    }

    // Accelerate Mode Toggle
    const btnAccel = document.getElementById('btn-accel');
    const accelBanner = document.getElementById('accel-banner');
    if (btnAccel) {
      btnAccel.addEventListener('click', () => {
        accelEnabled = !accelEnabled;
        btnAccel.textContent = 'Gyorsítás: ' + (accelEnabled ? 'BE' : 'KI');
        btnAccel.classList.toggle('active', accelEnabled);
        if (accelBanner) accelBanner.classList.toggle('active', accelEnabled);
        if (isPlaying) {
          stopMetronome();
          startMetronome();
        }
      });
    }

    // App Handoff / Deep Link Click
    const btnOpenApp = document.getElementById('btn-open-app');
    const qrOverlay = document.getElementById('qr-overlay');
    const btnCloseQr = document.getElementById('btn-close-qr');

    function isMobileDevice() {
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    if (btnOpenApp) {
      btnOpenApp.addEventListener('click', () => {
        // Construct live deep link with current in-widget settings
        let liveLink = deepLinkBase;
        if ("${mode}" === "metronome") {
          liveLink = 'metronomify://assistant/metronome?bpm=' + bpm + '&beats=' + beat + '&pattern=' + rhythmMode + '&start=true';
        }

        if (isMobileDevice()) {
          const start = Date.now();
          window.location.href = liveLink;
          setTimeout(() => {
            if (Date.now() - start < 1500) {
              window.location.href = playStoreUrl;
            }
          }, 1200);
        } else {
          if (qrOverlay) qrOverlay.classList.add('open');
        }
      });
    }

    if (btnCloseQr) {
      btnCloseQr.addEventListener('click', () => qrOverlay.classList.remove('open'));
    }
  </script>
</body>
</html>`;
}
