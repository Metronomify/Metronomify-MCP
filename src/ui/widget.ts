import QRCode from "qrcode";

export interface WidgetOptions {
  mode?: "metronome" | "sync" | "tuner" | "recorder";
  bpm?: number;
  beat?: number;
  room?: string;
  tuning?: string;
  a4?: number;
  title?: string;
}

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=hu.wind.metronomify";

export async function renderMetronomeWidget(options: WidgetOptions = {}): Promise<string> {
  const mode = options.mode || (options.room ? "sync" : "metronome");
  const bpm = options.bpm && options.bpm >= 20 && options.bpm <= 300 ? options.bpm : 120;
  const beat = options.beat !== undefined ? options.beat : 4;
  const room = options.room || (mode === "sync" ? "123456" : "");
  const tuning = options.tuning || "guitar_standard";
  const a4 = options.a4 || 440;
  const title = options.title || "Új felvétel";

  // Determine Deep Link URI for mobile
  let deepLink = "metronomify://assistant";
  if (mode === "sync") {
    deepLink = `metronomify://host?room=${room}&bpm=${bpm}&beat=${beat}`;
  } else if (mode === "tuner") {
    deepLink = `metronomify://assistant/tuner`;
  } else if (mode === "recorder") {
    deepLink = `metronomify://assistant/recorder`;
  } else {
    deepLink = `metronomify://assistant/metronome?bpm=${bpm}&beats=${beat}&start=true`;
  }

  // Generate QR Code data URL for desktop scanning
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(deepLink, {
      width: 240,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
  } catch (err) {
    console.error("QR generation failed:", err);
  }

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metronomify - AI Connected Assistant</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #131c2e;
      --card-border: rgba(99, 102, 241, 0.18);
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.4);
      --accent-hover: #4f46e5;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --green: #22c55e;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 14px;
    }
    .widget-container {
      background: var(--card-bg);
      border-radius: 24px;
      padding: 22px;
      width: 100%;
      max-width: 380px;
      border: 1px solid var(--card-border);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
      text-align: center;
      position: relative;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1.05rem;
      color: #c7d2fe;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .mode-tabs {
      display: flex;
      background: #0b1120;
      border-radius: 12px;
      padding: 3px;
      margin-bottom: 16px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .tab {
      flex: 1;
      padding: 6px 4px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .tab.active {
      background: var(--accent);
      color: #ffffff;
      box-shadow: 0 2px 8px var(--accent-glow);
    }
    
    /* Metronome / Sync UI */
    .beat-indicators {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin: 12px 0;
    }
    .beat-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #334155;
      transition: all 0.05s ease;
    }
    .beat-dot.active {
      background: var(--green);
      transform: scale(1.4);
      box-shadow: 0 0 10px var(--green);
    }
    .beat-dot.accent.active {
      background: #f43f5e;
      transform: scale(1.6);
      box-shadow: 0 0 14px #f43f5e;
    }
    .bpm-display {
      font-size: 4rem;
      font-weight: 800;
      line-height: 1;
      margin: 4px 0 2px;
      font-variant-numeric: tabular-nums;
      color: #ffffff;
    }
    .bpm-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 14px;
    }
    .sync-code-box {
      background: rgba(99, 102, 241, 0.12);
      border: 1px dashed rgba(99, 102, 241, 0.4);
      border-radius: 16px;
      padding: 14px;
      margin: 12px 0 16px;
    }
    .sync-code-num {
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: 6px;
      color: #e0e7ff;
      margin-top: 4px;
    }
    .slider-row {
      margin: 12px 0 16px;
    }
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: #334155;
      height: 6px;
      border-radius: 4px;
      outline: none;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    .controls-row {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    button {
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-step {
      background: #1e293b;
      color: var(--text);
      padding: 10px 14px;
      font-size: 0.95rem;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .btn-step:hover { background: #334155; }
    .btn-play {
      background: var(--accent);
      color: white;
      flex-grow: 1;
      padding: 12px;
      font-size: 1.05rem;
      box-shadow: 0 4px 12px var(--accent-glow);
    }
    .btn-play.playing {
      background: #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }
    
    /* Tuner Strings */
    .tuner-strings {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 16px 0;
    }
    .string-btn {
      background: #1e293b;
      color: #e2e8f0;
      padding: 12px 8px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer;
    }
    .string-btn:hover { background: #334155; border-color: var(--accent); }
    .string-note { font-size: 1.2rem; font-weight: 700; color: #a5b4fc; }
    .string-hz { font-size: 0.75rem; color: var(--text-muted); }

    /* App Handoff section */
    .handoff-box {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .btn-open-app {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      cursor: pointer;
    }
    .btn-open-app:hover { opacity: 0.92; transform: translateY(-1px); }

    /* Modal / QR Overlay */
    .qr-modal {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(8px);
      border-radius: 24px;
      padding: 24px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .qr-modal.open { display: flex; }
    .qr-img {
      width: 180px;
      height: 180px;
      border-radius: 14px;
      background: white;
      padding: 10px;
      margin: 12px 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .btn-close-qr {
      background: #334155;
      color: white;
      padding: 8px 20px;
      font-size: 0.85rem;
      margin-top: 8px;
      border-radius: 10px;
    }
    .play-link {
      color: #38bdf8;
      font-size: 0.8rem;
      margin-top: 10px;
      text-decoration: underline;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="header-bar">
      <div class="brand">
        <span>🎵</span> Metronomify
      </div>
      <div class="badge">${mode.toUpperCase()}</div>
    </div>

    <!-- Mode Tabs -->
    <div class="mode-tabs">
      <a href="?mode=metronome&bpm=${bpm}&beat=${beat}" class="tab ${mode === 'metronome' ? 'active' : ''}">Metronóm</a>
      <a href="?mode=sync&bpm=${bpm}&beat=${beat}&room=${room}" class="tab ${mode === 'sync' ? 'active' : ''}">Sync Szoba</a>
      <a href="?mode=tuner&a4=${a4}" class="tab ${mode === 'tuner' ? 'active' : ''}">Hangoló</a>
      <a href="?mode=recorder" class="tab ${mode === 'recorder' ? 'active' : ''}">Felvevő</a>
    </div>

    ${mode === 'sync' ? `
      <!-- SYNC ROOM VIEW -->
      <div class="sync-code-box">
        <div style="font-size: 0.8rem; color: #a5b4fc; text-transform: uppercase;">Próbaszoba kódja:</div>
        <div class="sync-code-num">${room}</div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">Közös próba zenekaroknak</div>
      </div>
    ` : ''}

    ${mode === 'tuner' ? `
      <!-- TUNER VIEW -->
      <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 8px;">Gitár Standard (A4 = ${a4} Hz)</div>
      <div class="tuner-strings">
        <button class="string-btn" onclick="playTone(82.41, 'E2')"><div class="string-note">E2</div><div class="string-hz">82.4 Hz</div></button>
        <button class="string-btn" onclick="playTone(110.00, 'A2')"><div class="string-note">A2</div><div class="string-hz">110 Hz</div></button>
        <button class="string-btn" onclick="playTone(146.83, 'D3')"><div class="string-note">D3</div><div class="string-hz">146.8 Hz</div></button>
        <button class="string-btn" onclick="playTone(196.00, 'G3')"><div class="string-note">G3</div><div class="string-hz">196 Hz</div></button>
        <button class="string-btn" onclick="playTone(246.94, 'B3')"><div class="string-note">B3</div><div class="string-hz">246.9 Hz</div></button>
        <button class="string-btn" onclick="playTone(329.63, 'E4')"><div class="string-note">E4</div><div class="string-hz">329.6 Hz</div></button>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">Kattints egy húrra a teszthanghoz!</div>
    ` : mode === 'recorder' ? `
      <!-- RECORDER VIEW -->
      <div style="padding: 24px 12px; background: rgba(239, 68, 68, 0.08); border-radius: 16px; margin: 12px 0;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🎙️</div>
        <div style="font-weight: 700; font-size: 1.1rem; color: #fca5a5;">${title}</div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">Rögzítsd a próbát stúdió minőségben</div>
      </div>
    ` : `
      <!-- METRONOME CONTROLS VIEW -->
      <div class="beat-indicators" id="beat-dots"></div>
      <div class="bpm-display" id="bpm-val">${bpm}</div>
      <div class="bpm-sub" id="tempo-label">Moderato</div>

      <div class="slider-row">
        <input type="range" id="bpm-slider" min="30" max="250" value="${bpm}">
      </div>

      <div class="controls-row">
        <button class="btn-step" id="btn-minus">-5</button>
        <button class="btn-play" id="btn-play">Start</button>
        <button class="btn-step" id="btn-plus">+5</button>
      </div>
    `}

    <!-- App Handoff / Open In App Button -->
    <div class="handoff-box">
      <button class="btn-open-app" id="btn-app-handoff">
        <span>📲</span>
        <span>
          ${mode === 'sync' ? 'Szoba indítása az Appban' :
            mode === 'tuner' ? 'Hangoló megnyitása az Appban' :
            mode === 'recorder' ? 'Felvevő megnyitása az Appban' :
            'Megnyitás a Metronomify-ban'}
        </span>
      </button>
      <div style="margin-top: 8px;">
        <a href="${PLAY_STORE_URL}" target="_blank" class="play-link">Nincs még meg az app? Letöltés a Google Play-ről</a>
      </div>
    </div>

    <!-- QR Modal for Desktop Users -->
    <div class="qr-modal" id="qr-modal">
      <div style="font-weight: 700; font-size: 1.1rem; color: #ffffff;">📲 Szkenneld a telefonoddal</div>
      <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px; max-width: 260px;">Nyisd meg a kamera appot a telefonodon a fenti beállítások átvételéhez!</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR code" class="qr-img">` : ''}
      <button class="btn-close-qr" id="btn-close-qr">Bezárás</button>
    </div>
  </div>

  <script>
    const deepLinkUrl = ${JSON.stringify(deepLink)};
    const playStoreUrl = ${JSON.stringify(PLAY_STORE_URL)};
    let bpm = ${bpm};
    let beatCount = ${beat};
    let currentBeat = 0;
    let isPlaying = false;
    let timer = null;
    let audioCtx = null;

    // Is mobile device?
    function isMobile() {
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // App handoff logic
    const btnAppHandoff = document.getElementById('btn-app-handoff');
    const qrModal = document.getElementById('qr-modal');
    const btnCloseQr = document.getElementById('btn-close-qr');

    if (btnAppHandoff) {
      btnAppHandoff.addEventListener('click', () => {
        if (isMobile()) {
          // On mobile: attempt deep link with Play Store fallback
          const start = Date.now();
          window.location.href = deepLinkUrl;
          setTimeout(() => {
            if (Date.now() - start < 1500) {
              window.location.href = playStoreUrl;
            }
          }, 1200);
        } else {
          // On desktop: show QR modal
          qrModal.classList.add('open');
        }
      });
    }

    if (btnCloseQr) {
      btnCloseQr.addEventListener('click', () => qrModal.classList.remove('open'));
    }

    // WebAudio Tone Generator for Tuner Reference
    function playTone(freq, noteName) {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    }

    // Metronome Beep & Pulse
    function playClick(isAccent) {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = isAccent ? 1200 : 800;
      gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);

      const dots = document.querySelectorAll('.beat-dot');
      dots.forEach((d, idx) => {
        if (idx === currentBeat) {
          d.classList.add('active');
          setTimeout(() => d.classList.remove('active'), 90);
        }
      });
    }

    function renderDots() {
      const container = document.getElementById('beat-dots');
      if (!container) return;
      container.innerHTML = '';
      for (let i = 0; i < (beatCount > 0 ? beatCount : 1); i++) {
        const d = document.createElement('div');
        d.className = 'beat-dot' + (i === 0 ? ' accent' : '');
        container.appendChild(d);
      }
    }

    function tick() {
      const isAccent = (currentBeat === 0 && beatCount > 1);
      playClick(isAccent);
      currentBeat = (currentBeat + 1) % (beatCount > 0 ? beatCount : 1);
    }

    function startMetronome() {
      isPlaying = true;
      const btn = document.getElementById('btn-play');
      if (btn) {
        btn.textContent = 'Stop';
        btn.classList.add('playing');
      }
      currentBeat = 0;
      tick();
      timer = setInterval(tick, (60 / bpm) * 1000);
    }

    function stopMetronome() {
      isPlaying = false;
      const btn = document.getElementById('btn-play');
      if (btn) {
        btn.textContent = 'Start';
        btn.classList.remove('playing');
      }
      if (timer) clearInterval(timer);
      timer = null;
    }

    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (isPlaying) stopMetronome();
        else startMetronome();
      });
    }

    const slider = document.getElementById('bpm-slider');
    const bpmVal = document.getElementById('bpm-val');
    const tempoLabel = document.getElementById('tempo-label');

    function getTempoName(b) {
      if (b < 60) return 'Largo';
      if (b < 77) return 'Adagio';
      if (b < 108) return 'Andante';
      if (b < 120) return 'Moderato';
      if (b < 168) return 'Allegro';
      if (b < 200) return 'Presto';
      return 'Prestissimo';
    }

    function updateBpm(newBpm) {
      bpm = Math.min(280, Math.max(30, newBpm));
      if (slider) slider.value = bpm;
      if (bpmVal) bpmVal.textContent = bpm;
      if (tempoLabel) tempoLabel.textContent = getTempoName(bpm);
      if (isPlaying) {
        if (timer) clearInterval(timer);
        timer = setInterval(tick, (60 / bpm) * 1000);
      }
    }

    if (slider) slider.addEventListener('input', (e) => updateBpm(parseInt(e.target.value, 10)));
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    if (btnMinus) btnMinus.addEventListener('click', () => updateBpm(bpm - 5));
    if (btnPlus) btnPlus.addEventListener('click', () => updateBpm(bpm + 5));

    renderDots();
  </script>
</body>
</html>`;
}
