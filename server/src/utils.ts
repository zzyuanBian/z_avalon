import { randomBytes } from 'crypto';
import { ROOM_CODE_LENGTH, ROOM_CODE_CHARS } from '../../shared/constants.js';

export function generateRoomCode(existingRooms: Map<string, unknown>): string {
  const chars = ROOM_CODE_CHARS;
  let code = '';
  const bytes = randomBytes(ROOM_CODE_LENGTH);
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  if (existingRooms.has(code)) return generateRoomCode(existingRooms);
  return code;
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
