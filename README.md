# 🎵 Metronomify MCP Server (Google Connected Apps & Gemini)

A hivatalos **Model Context Protocol (MCP)** szerver a **Metronomify** alkalmazáshoz (`hu.wind.metronomify`), a Google **Connected Apps Platform** (Gemini App integráció) szabványának megfelelően.

---

## 🌟 Funkciók és Képességek (Tools)

1. **`create_metronome_sync_room`**: Közös szinkronizált zenei próbaszoba indítása zenészeknek és zenekaroknak. 6-jegyű szobakódot és csatlakozási linket ad vissza.
2. **`get_sync_room_status`**: Élő szoba tempójának (BPM), lejátszási állapotának és résztvevőinek lekérdezése.
3. **`update_room_tempo`**: Folyamatban lévő szoba tempójának (BPM) valós idejű módosítása a Gemini felületéről minden csatlakozott zenész eszközén.
4. **`control_room_playback`**: Szinkronizált lejátszás elindítása vagy megállítása (start / stop).
5. **`lookup_musical_tempo`**: Klasszikus zenei tempójelzések (Allegro, Andante, Presto, Largo) és műfaji BPM ajánlások (Rock, Pop, Jazz, Metal, Ballad).
6. **`calculate_beat_delays_and_subdivisions`**: Negyedhang, nyolcad, tizenhatod, triolák, pontozott hangok és delay effekt millisekundum időzítések BPM alapján.
7. **`get_instrument_tuning_reference`**: Hangszer referencia frekvenciák (Hz) és húrok A4 referencia hangolás alapján (432Hz, 440Hz, 442Hz) gitárhoz, basszushoz, hegedűhöz, csellóhoz és ukuleléhez (a Metronomify Tuner specifikációja alapján).
8. **`generate_speed_trainer_routine`**: Fokozatos tempónövelő gyakorlási terv (Speed Trainer) bemelegítéssel és céltempóval.
9. **`get_polyrhythm_guide`**: Poliritmus (pl. 3:2, 4:3, 5:4) magyarázatok és tanulási mondókák.
10. **Interaktív iFrame UI Widget (`/widget`)**: Beágyazható, kattintható metronóm widget vizuális pulzálással és hanggal, ami az MCP App (iFrames) felületen közvetlenül megjeleníthető.

---

## 🚀 Indítás és Futtatás

### 1. Függőségek és build
```bash
npm install
npm run build
```

### 2. HTTP / SSE Szerver indítása (Connected Apps & Gemini)
```bash
npm start
# vagy fejlesztői módban automatikus újratöltéssel:
npm run dev
```

A szerver a `http://localhost:3001` címen fog futni:
- **SSE végpont:** `http://localhost:3001/v1/sse`
- **Messages végpont:** `http://localhost:3001/v1/messages`
- **Interaktív Widget:** `http://localhost:3001/widget`
- **Health check:** `http://localhost:3001/health`
- **Katalógus:** `http://localhost:3001/tools`

### 3. Teszt kliens futtatása
```bash
npm run test:client
```

### 4. Helyi Stdio mód (pl. Claude Desktop vagy Antigravity)
```bash
npm run dev:stdio
```

---

## 🐳 Futtatás Dockerrel

```bash
docker compose up -d --build
```

---

## 🌐 Telepítés a meglévő backend szerverre (`metronomify.herowarriors.hu`)

A meglévő Nginx / szerver mögé beköthető például egy külön aldomainként:
`https://mcp.metronomify.herowarriors.hu/v1/sse`
vagy almappaként:
`https://metronomify.herowarriors.hu/mcp/v1/sse`
