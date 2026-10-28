/**
 * Metronomify Synchronized Rooms Manager
 * Integrates with Metronomify Socket.IO server or provides in-memory fallback
 */
import { io as createSocketClient, Socket } from "socket.io-client";

export interface MetronomeRoomState {
  roomCode: string;
  bpm: number;
  isPlaying: boolean;
  beat: number; // 0: 4/4, 1: 3/4, etc.
  soundMode: string;
  members: number;
  createdAt: string;
  source: "live_backend" | "mcp_internal";
  shareUrl: string;
}

// In-memory rooms cache / fallback
const internalRooms = new Map<string, MetronomeRoomState>();

// Generate 6-digit room code
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

const BACKEND_URL = process.env.METRONOMIFY_BACKEND_URL || "https://metronomify.herowarriors.hu";

let socket: Socket | null = null;
let isSocketConnected = false;

export function initSocketConnection() {
  if (socket) return;

  try {
    socket = createSocketClient(BACKEND_URL, {
      transports: ["websocket", "polling"],
      auth: {
        versionCode: 16,
        integrityToken: "DEBUG_TOKEN"
      },
      reconnectionAttempts: 3,
      timeout: 4000
    });

    socket.on("connect", () => {
      isSocketConnected = true;
      console.log(`[MCP Rooms] Connected to Metronomify backend: ${BACKEND_URL}`);
    });

    socket.on("disconnect", () => {
      isSocketConnected = false;
      console.log("[MCP Rooms] Disconnected from Metronomify backend. Using local sync fallback.");
    });

    socket.on("connect_error", (err) => {
      isSocketConnected = false;
      console.warn(`[MCP Rooms] Backend socket connection failed: ${err.message}. Using internal fallback.`);
    });
  } catch (e: any) {
    console.warn(`[MCP Rooms] Could not initialize socket: ${e.message}`);
  }
}

// Initialize socket connection non-blocking
initSocketConnection();

export async function createRoom(options?: { bpm?: number; soundMode?: string }): Promise<MetronomeRoomState> {
  const roomCode = generateRoomCode();
  const bpm = options?.bpm && options.bpm >= 30 && options.bpm <= 300 ? options.bpm : 120;
  const soundMode = options?.soundMode || "classic";

  const roomState: MetronomeRoomState = {
    roomCode,
    bpm,
    isPlaying: false,
    beat: 0,
    soundMode,
    members: 1,
    createdAt: new Date().toISOString(),
    source: isSocketConnected ? "live_backend" : "mcp_internal",
    shareUrl: `https://metronomify.herowarriors.hu/room/${roomCode}`
  };

  internalRooms.set(roomCode, roomState);

  if (socket && isSocketConnected) {
    socket.emit("create_room", roomCode);
    socket.emit("update_bpm", { roomCode, bpm });
  }

  return roomState;
}

export async function getRoom(roomCode: string): Promise<MetronomeRoomState | null> {
  const cleanCode = roomCode.trim();
  if (internalRooms.has(cleanCode)) {
    return internalRooms.get(cleanCode)!;
  }
  return null;
}

export async function updateRoomTempo(roomCode: string, bpm: number): Promise<MetronomeRoomState> {
  const cleanCode = roomCode.trim();
  if (bpm < 30 || bpm > 300) {
    throw new Error("BPM must be between 30 and 300");
  }

  let room = internalRooms.get(cleanCode);
  if (!room) {
    // If not found, create or assume existing room
    room = {
      roomCode: cleanCode,
      bpm,
      isPlaying: false,
      beat: 0,
      soundMode: "classic",
      members: 1,
      createdAt: new Date().toISOString(),
      source: isSocketConnected ? "live_backend" : "mcp_internal",
      shareUrl: `https://metronomify.herowarriors.hu/room/${cleanCode}`
    };
  }

  room.bpm = bpm;
  internalRooms.set(cleanCode, room);

  if (socket && isSocketConnected) {
    socket.emit("update_bpm", { roomCode: cleanCode, bpm });
  }

  return room;
}

export async function controlRoomPlayback(roomCode: string, action: "start" | "stop"): Promise<MetronomeRoomState> {
  const cleanCode = roomCode.trim();
  let room = internalRooms.get(cleanCode);
  if (!room) {
    throw new Error(`Room ${cleanCode} not found`);
  }

  room.isPlaying = action === "start";
  internalRooms.set(cleanCode, room);

  if (socket && isSocketConnected) {
    socket.emit("update_state", {
      roomCode: cleanCode,
      bpm: room.bpm,
      isPlaying: room.isPlaying,
      beat: room.beat,
      soundMode: room.soundMode,
      epoch: Date.now(),
      epochBeatIndex: 0
    });
  }

  return room;
}

export function listActiveRooms(): MetronomeRoomState[] {
  return Array.from(internalRooms.values());
}
