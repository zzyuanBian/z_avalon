import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GameState, LogEntry } from '../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

interface GameRecord {
  id: string;
  roomId: string;
  playerCount: number;
  winner: string | null;
  winReason: string | null;
  players: { id: string; name: string }[];
  fullState: GameState | null;
  events: LogEntry[];
  createdAt: number;
  finishedAt: number | null;
}

let games: GameRecord[] = [];

export function initDatabase(): void {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load existing games
  if (fs.existsSync(GAMES_FILE)) {
    try {
      const raw = fs.readFileSync(GAMES_FILE, 'utf-8');
      games = JSON.parse(raw);
      console.log(`[database] Loaded ${games.length} game records`);
    } catch (e) {
      console.error('[database] Failed to load games, starting fresh');
      games = [];
    }
  } else {
    games = [];
  }

  console.log(`[database] JSON storage initialized at ${DATA_DIR}`);
}

function saveToDisk(): void {
  try {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf-8');
  } catch (e) {
    console.error('[database] Failed to save games to disk', e);
  }
}

export function saveGameStart(state: GameState): void {
  // Check if record already exists (from a prior start)
  const existing = games.find(g => g.id === state.roomId);
  if (existing) {
    existing.fullState = state;
    existing.events = [...state.log];
    existing.players = state.players.map(p => ({ id: p.id, name: p.name }));
    existing.playerCount = state.players.length;
  } else {
    games.push({
      id: state.roomId,
      roomId: state.roomId,
      playerCount: state.players.length,
      winner: null,
      winReason: null,
      players: state.players.map(p => ({ id: p.id, name: p.name })),
      fullState: { ...state },
      events: [...state.log],
      createdAt: state.createdAt,
      finishedAt: null,
    });
  }
  saveToDisk();
}

export function saveGameEnd(state: GameState): void {
  const record = games.find(g => g.id === state.roomId);
  if (record) {
    record.winner = state.winner;
    record.winReason = state.winReason;
    record.fullState = { ...state };
    record.events = [...state.log];
    record.finishedAt = Date.now();
    saveToDisk();
    console.log(`[database] Game ${state.roomId} saved: ${state.winner} wins`);
  }
}

export function getGameList(limit = 50, offset = 0): GameRecord[] {
  // Sort by createdAt desc, then paginate
  const sorted = [...games].sort((a, b) => b.createdAt - a.createdAt);
  return sorted.slice(offset, offset + limit).map(g => ({
    ...g,
    fullState: null, // Don't send full state in list view
  }));
}

export function getGameDetail(gameId: string): GameRecord | null {
  return games.find(g => g.id === gameId) || null;
}

export function getGameCount(): number {
  return games.length;
}
