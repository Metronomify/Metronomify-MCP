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
  calculateSubdivisionsAndDelay
} from "./tools/tempo.js";
import {
  generateSpeedTrainerRoutine,
  getPolyrhythmGuide
} from "./tools/practice.js";

export function createMetronomifyMcpServer(): McpServer {
  const server = new McpServer({
    name: "metronomify-mcp",
    version: "2.0.0"
  });

  // 1. Tool: setup_metronome (All features matching Android app)
  server.tool(
    "setup_metronome",
    "Configure and preview the full Metronomify metronome with 15-500 BPM, all subdivisions, classic/modern sound samples, speed acceleration training, and 1-click app handoff.",
    {
      bpm: z.number().min(15).max(500).default(120).describe("Tempo in beats per minute (15-500)"),
      beat: z.number().min(0).max(16).default(4).describe("Beats per measure (0 for no accent, 2, 3, 4, 5, 6, 7, 8, etc.)"),
      rhythm: z
        .enum([
          "QUARTER_NOTE",
          "EIGHTH_NOTES",
          "TRIPLET",
          "SIXTEENTH_NOTES",
          "DOTTED_EIGHTH",
          "QUARTER_TWO_EIGHTHS"
        ])
        .default("QUARTER_NOTE")
        .describe("Rhythm subdivision pattern matching Metronomify"),
      soundMode: z.enum(["classic", "modern"]).default("classic").describe("Sound sample: 'classic' (crisp tick) or 'modern' (wood click)"),
      accelEnabled: z.boolean().default(false).describe("Enable speed training / gradual tempo acceleration"),
      accelTargetBpm: z.number().min(20).max(500).optional().describe("Target end BPM for speed training"),
      accelStepBpm: z.number().min(1).max(20).optional().describe("BPM increase per increment step"),
      accelIntervalSec: z.number().min(2).max(120).optional().describe("Seconds between tempo increases")
    },
    async ({
      bpm,
      beat,
      rhythm,
      soundMode,
      accelEnabled,
      accelTargetBpm,
      accelStepBpm,
      accelIntervalSec
    }) => {
      const queryParams = new URLSearchParams({
        mode: "metronome",
        bpm: bpm.toString(),
        beat: beat.toString(),
        rhythm,
        soundMode
      });

      if (accelEnabled) {
        queryParams.set("accelEnabled", "true");
        if (accelTargetBpm) queryParams.set("accelTargetBpm", accelTargetBpm.toString());
        if (accelStepBpm) queryParams.set("accelStepBpm", accelStepBpm.toString());
        if (accelIntervalSec) queryParams.set("accelIntervalSec", accelIntervalSec.toString());
      }

      const widgetUrl = `/widget?${queryParams.toString()}`;
      const deepLink = `metronomify://assistant/metronome?bpm=${bpm}&beats=${beat}&pattern=${rhythm}&start=true`;
      const handoffUrl = `/open?target=metronome&bpm=${bpm}&beat=${beat}&pattern=${rhythm}&start=true`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `⏱️ Metronóm előkészítve: ${bpm} BPM (${beat > 0 ? beat + '/4' : 'Hangsúly nélkül'}, ${rhythm}, ${soundMode})`,
                bpm,
                beat,
                rhythm,
                soundMode,
                speedAcceleration: accelEnabled
                  ? { targetBpm: accelTargetBpm || bpm + 40, step: accelStepBpm || 5, intervalSec: accelIntervalSec || 10 }
                  : "disabled",
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appDeepLink: deepLink,
                instructions: "A widget a telefonos app eredeti felületét mutatja valódi hangmintákkal és azonnali átadási gombbal."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 2. Tool: create_metronome_sync_room (Clean parameter card only, no complex playback)
  server.tool(
    "create_metronome_sync_room",
    "Prepare a synchronized rehearsal room with requested tempo and rhythm parameters, returning a clean parameter overview and direct app sync button.",
    {
      bpm: z.number().min(15).max(500).default(120).describe("Starting tempo in BPM (15-500)"),
      beat: z.number().min(0).max(16).default(4).describe("Beats per measure (e.g. 4 for 4/4)")
    },
    async ({ bpm, beat }) => {
      const room = await createRoom({ bpm });
      const widgetUrl = `/widget?mode=sync&room=${room.roomCode}&bpm=${bpm}&beat=${beat}`;
      const hostDeepLink = `metronomify://host?room=${room.roomCode}&bpm=${bpm}&beat=${beat}`;
      const handoffUrl = `/open?target=host&room=${room.roomCode}&bpm=${bpm}&beat=${beat}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `✅ Metronomify szinkron szoba előkészítve: ${room.roomCode}`,
                roomCode: room.roomCode,
                bpm,
                beat: beat > 0 ? `${beat}/4` : "Hangsúly nélkül",
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appHostDeepLink: hostDeepLink,
                instructions: "A megnyitás gomb azonnal elindítja az appban a szobát a beállított BPM-mel és felhozza a QR kódos nézetet."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 3. Tool: setup_tuner (Lists configured options, then button takes to app)
  server.tool(
    "setup_tuner",
    "List and prepare instrument tuner options (A4 reference frequency, note naming system, sharps/flats, octave) with 1-click launch into the Metronomify Tuner.",
    {
      a4FrequencyHz: z.number().min(415).max(465).default(440).describe("A4 reference frequency in Hertz (415-465, standard: 440)"),
      namingSystem: z.enum(["standard", "solfege", "german"]).default("standard").describe("Note naming system: standard (C D E F G A B), solfege (Do Re Mi), or german (C D E F G A H)"),
      accidental: z.enum(["sharps", "flats"]).default("sharps").describe("Preferred accidentals: 'sharps' (#) or 'flats' (b)"),
      showOctave: z.boolean().default(true).describe("Display octave numbers (e.g. A4)")
    },
    async ({ a4FrequencyHz, namingSystem, accidental, showOctave }) => {
      const queryParams = new URLSearchParams({
        mode: "tuner",
        a4: a4FrequencyHz.toString(),
        system: namingSystem,
        accidental,
        octave: showOctave.toString()
      });

      const widgetUrl = `/widget?${queryParams.toString()}`;
      const deepLink = `metronomify://assistant/tuner?a4=${a4FrequencyHz}&system=${namingSystem}&accidental=${accidental}&octave=${showOctave}`;
      const handoffUrl = `/open?target=tuner`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                tunerSettings: {
                  a4FrequencyHz,
                  namingSystem: namingSystem === "solfege" ? "Szolmizáció (Do Re Mi)" : namingSystem === "german" ? "Német (C D E F G A H)" : "Standard (C D E F G A B)",
                  accidentalPreference: accidental === "flats" ? "Bék (b / Flats)" : "Keresztek (# / Sharps)",
                  showOctaveNumber: showOctave
                },
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appDeepLink: deepLink,
                instructions: "A widget áttekintést ad a kiválasztott hangoló paraméterekről, a gomb pedig azonnal átadja azokat az appnak."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 4. Tool: setup_audio_recorder (Direct handoff only)
  server.tool(
    "setup_audio_recorder",
    "Open the Metronomify studio audio recorder in the Android app.",
    {
      title: z.string().optional().describe("Optional recording title")
    },
    async ({ title }) => {
      const widgetUrl = `/widget?mode=recorder${title ? `&title=${encodeURIComponent(title)}` : ''}`;
      const deepLink = `metronomify://assistant/recorder`;
      const handoffUrl = `/open?target=recorder`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "🎙️ Metronomify Hangrögzítő megnyitása",
                widgetEmbedUrl: widgetUrl,
                appHandoffUrl: handoffUrl,
                appDeepLink: deepLink,
                instructions: "Kattints a gombra a stúdió minőségű hangrögzítő azonnali megnyitásához az Android appban."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // 5. Tool: lookup_musical_tempo
  server.tool(
    "lookup_musical_tempo",
    "Find standard BPM ranges and Italian tempo markings (Allegro, Andante, Presto, Adagio) and genre BPM guides.",
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

  // 6. Tool: calculate_beat_delays_and_subdivisions
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

  // 7. Tool: generate_speed_trainer_routine
  server.tool(
    "generate_speed_trainer_routine",
    "Generate a structured tempo practice routine that gradually ramps up BPM to build speed and accuracy for instrument practice.",
    {
      startBpm: z.number().min(15).max(450).describe("Starting warmup tempo"),
      targetBpm: z.number().min(20).max(500).describe("Final goal tempo"),
      durationMinutes: z.number().min(5).max(120).default(15).describe("Total practice session length in minutes"),
      stepBpm: z.number().min(1).max(20).default(5).describe("BPM increase per increment step")
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

  // 8. Tool: get_polyrhythm_guide
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

  // Active rooms resource
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
