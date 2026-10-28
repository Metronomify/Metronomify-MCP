import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createRoom,
  getRoom,
  updateRoomTempo,
  controlRoomPlayback,
  listActiveRooms
} from "./tools/rooms.js";
import {
  lookupTempo,
  calculateSubdivisionsAndDelay,
  TEMPO_TERMS,
  GENRE_BPM_RANGES
} from "./tools/tempo.js";
import {
  calculateTuningFrequencies,
  INSTRUMENT_TUNINGS
} from "./tools/tuner.js";
import {
  generateSpeedTrainerRoutine,
  getPolyrhythmGuide,
  POLYRHYTHMS
} from "./tools/practice.js";

export function createMetronomifyMcpServer(): McpServer {
  const server = new McpServer({
    name: "metronomify-mcp",
    version: "1.0.0"
  });

  // 1. Tool: create_metronome_sync_room
  server.tool(
    "create_metronome_sync_room",
    "Create a shared synchronized metronome room for musicians or band members to rehearse together at the exact same tempo in real-time. Returns room code, app deep links, and interactive widget preview.",
    {
      bpm: z.number().min(20).max(300).default(120).describe("Starting tempo in beats per minute (20-300)"),
      beat: z.number().min(0).max(16).default(4).describe("Beats per measure (e.g. 4 for 4/4, 3 for 3/4, 0 for no accent)"),
      soundMode: z.enum(["classic", "wood", "digital", "beep"]).optional().describe("Metronome click sound style")
    },
    async ({ bpm, beat, soundMode }) => {
      const room = await createRoom({ bpm, soundMode });
      const hostDeepLink = `metronomify://host?room=${room.roomCode}&bpm=${bpm}&beat=${beat}`;
      const joinDeepLink = `metronomify://join?room=${room.roomCode}`;
      const handoffUrl = `/open?target=host&room=${room.roomCode}&bpm=${bpm}&beat=${beat}`;
      const widgetUrl = `/widget?mode=sync&room=${room.roomCode}&bpm=${bpm}&beat=${beat}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `✅ Metronomify szinkron szoba elkészült: ${room.roomCode}`,
                roomCode: room.roomCode,
                bpm,
                beat: `${beat}/4`,
                soundMode: room.soundMode,
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appHostDeepLink: hostDeepLink,
                appJoinDeepLink: joinDeepLink,
                instructions: "A fenti gomb megnyomásával a telefon azonnal megnyitja az appban a szobát a beállított BPM-mel és QR kóddal."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 2. Tool: setup_metronome
  server.tool(
    "setup_metronome",
    "Configure and preview a metronome tempo (BPM) and beat accent pattern with playback and one-click app launch.",
    {
      bpm: z.number().min(20).max(300).describe("Tempo in beats per minute"),
      beat: z.number().min(0).max(16).default(4).describe("Beats per measure (4 = 4/4, 3 = 3/4)"),
      start: z.boolean().default(true).describe("Whether the mobile app should immediately start playing upon open")
    },
    async ({ bpm, beat, start }) => {
      const widgetUrl = `/widget?mode=metronome&bpm=${bpm}&beat=${beat}`;
      const deepLink = `metronomify://assistant/metronome?bpm=${bpm}&beats=${beat}&start=${start}`;
      const handoffUrl = `/open?target=metronome&bpm=${bpm}&beat=${beat}&start=${start}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `⏱️ Metronóm előkészítve: ${bpm} BPM (${beat}/4 ütem)`,
                bpm,
                beat,
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appDeepLink: deepLink,
                instructions: "A widgetben helyben tesztelhető a hang és a pulzálás, a 'Megnyitás a Metronomify-ban' gomb pedig közvetlenül átadja az appnak."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 3. Tool: setup_tuner
  server.tool(
    "setup_tuner",
    "Prepare instrument tuning (Guitar, Bass, Ukulele, Strings) with custom A4 calibration (440Hz, 432Hz) and direct app handoff.",
    {
      instrument: z
        .enum([
          "guitar_standard",
          "guitar_drop_d",
          "bass_standard_4",
          "ukulele_standard",
          "violin_standard",
          "cello_standard"
        ])
        .default("guitar_standard")
        .describe("Instrument tuning preset"),
      a4FrequencyHz: z.number().min(400).max(460).default(440).describe("A4 reference frequency in Hz")
    },
    async ({ instrument, a4FrequencyHz }) => {
      const tuningData = calculateTuningFrequencies(instrument, a4FrequencyHz);
      const widgetUrl = `/widget?mode=tuner&tuning=${instrument}&a4=${a4FrequencyHz}`;
      const deepLink = `metronomify://assistant/tuner`;
      const handoffUrl = `/open?target=tuner`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                tuning: tuningData,
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appDeepLink: deepLink,
                instructions: "A widgetben megszólaltathatóak a referencia hangok, a gomb pedig az app beépített Tuner képernyőjére visz."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 4. Tool: setup_audio_recorder
  server.tool(
    "setup_audio_recorder",
    "Prepare a new audio recording session with project title and launch the Metronomify Recorder.",
    {
      title: z.string().default("Új próba felvétel").describe("Recording title or song name"),
      bpm: z.number().optional().describe("Associated song BPM")
    },
    async ({ title, bpm }) => {
      const widgetUrl = `/widget?mode=recorder&title=${encodeURIComponent(title)}${bpm ? `&bpm=${bpm}` : ''}`;
      const deepLink = `metronomify://assistant/recorder`;
      const handoffUrl = `/open?target=recorder`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                title,
                bpm: bpm || "none",
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appDeepLink: deepLink,
                instructions: "A gomb megnyomásával a Metronomify azonnal megnyitja a stúdió minőségű hangrögzítőt."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 5. Tool: get_sync_room_status
  server.tool(
    "get_sync_room_status",
    "Retrieve the current tempo (BPM), active playback status, and participants count for an existing Metronomify rehearsal room.",
    {
      roomCode: z.string().length(6).describe("The 6-digit Metronomify room code")
    },
    async ({ roomCode }) => {
      const room = await getRoom(roomCode);
      if (!room) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "not_found",
                message: `Room ${roomCode} is not currently active or has expired.`
              })
            }
          ]
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(room, null, 2)
          }
        ]
      };
    }
  );

  // 6. Tool: update_room_tempo
  server.tool(
    "update_room_tempo",
    "Adjust or change the tempo (BPM) of an active synchronized rehearsal room in real-time across all connected musician devices.",
    {
      roomCode: z.string().length(6).describe("The 6-digit room code"),
      bpm: z.number().min(20).max(300).describe("New tempo in beats per minute")
    },
    async ({ roomCode, bpm }) => {
      const updated = await updateRoomTempo(roomCode, bpm);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `⚡ Tempo updated to ${bpm} BPM for room ${roomCode}`,
                room: updated
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 7. Tool: control_room_playback
  server.tool(
    "control_room_playback",
    "Start or stop playback for all musicians connected to a synchronized Metronomify metronome room.",
    {
      roomCode: z.string().length(6).describe("The 6-digit room code"),
      action: z.enum(["start", "stop"]).describe("Play action: 'start' to begin clicking, 'stop' to pause")
    },
    async ({ roomCode, action }) => {
      const updated = await controlRoomPlayback(roomCode, action);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `▶️ Room ${roomCode} playback ${action === "start" ? "started" : "stopped"}`,
                room: updated
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 8. Tool: lookup_musical_tempo
  server.tool(
    "lookup_musical_tempo",
    "Find standard BPM ranges, classical Italian tempo markings (Allegro, Andante, Presto, Adagio), and typical tempo ranges for musical genres.",
    {
      query: z.string().describe("Musical term or genre")
    },
    async ({ query }) => {
      const result = lookupTempo(query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 9. Tool: calculate_beat_delays_and_subdivisions
  server.tool(
    "calculate_beat_delays_and_subdivisions",
    "Calculate precise millisecond timings for quarter notes, eighth notes, sixteenth notes, triplets, and delay effect sync at any target BPM.",
    {
      bpm: z.number().min(1).max(500).describe("Tempo in beats per minute")
    },
    async ({ bpm }) => {
      const result = calculateSubdivisionsAndDelay(bpm);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 10. Tool: generate_speed_trainer_routine
  server.tool(
    "generate_speed_trainer_routine",
    "Generate a structured tempo practice routine that gradually ramps up BPM to build speed and accuracy for instrument practice.",
    {
      startBpm: z.number().min(30).max(280).describe("Starting warmup tempo"),
      targetBpm: z.number().min(40).max(300).describe("Final goal tempo"),
      durationMinutes: z.number().min(5).max(120).default(15).describe("Total practice session length in minutes"),
      stepBpm: z.number().min(2).max(20).default(5).describe("BPM increase per increment step")
    },
    async ({ startBpm, targetBpm, durationMinutes, stepBpm }) => {
      const routine = generateSpeedTrainerRoutine(startBpm, targetBpm, durationMinutes, stepBpm);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(routine, null, 2)
          }
        ]
      };
    }
  );

  // 11. Tool: get_polyrhythm_guide
  server.tool(
    "get_polyrhythm_guide",
    "Get explanation, counting patterns, and mnemonic memory phrases for polyrhythms (e.g. 3:2, 4:3, 5:4).",
    {
      ratio: z.enum(["3:2", "4:3", "5:4"]).optional().describe("Polyrhythm ratio")
    },
    async ({ ratio }) => {
      const result = getPolyrhythmGuide(ratio);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Resource: active rooms
  server.resource(
    "active-rooms",
    "metronomify://rooms/active",
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(listActiveRooms(), null, 2)
        }
      ]
    })
  );

  return server;
}
