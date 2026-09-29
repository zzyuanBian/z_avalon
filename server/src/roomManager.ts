import { v4 as uuid } from 'uuid';
import type { Player, GameState } from '../../shared/types.js';
import { generateRoomCode } from './utils.js';

export interface Room {
  id: string;
  name: string;
  players: Player[];
  hostId: string;
  gameState: GameState | null;
  createdAt: number;
}

const rooms = new Map<string, Room>();

export function createRoom(playerName: string, roomName?: string, avatar?: number): { room: Room; playerId: string } {
  const roomId = generateRoomCode(rooms);
  const playerId = uuid();

  const player: Player = {
    id: playerId,
    name: playerName,
    seatIndex: 0,
    connected: true,
    avatar: avatar ?? Math.floor(Math.random() * 16),
  };

  const room: Room = {
    id: roomId,
    name: roomName?.trim() || '',
    players: [player],
    hostId: playerId,
    gameState: null,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  return { room, playerId };
}

export function joinRoom(roomId: string, playerName: string, avatar?: number): { room: Room; playerId: string } | { error: string } {
  const room = rooms.get(roomId);
  if (!room) return { error: '房间不存在' };
  if (room.players.length >= 10) return { error: '房间已满（最多10人）' };

  // Check if a disconnected player with same name exists (reconnection scenario)
  // This must happen BEFORE the game phase check, so players can rejoin mid-game
  const disconnectedPlayer = room.players.find(p => p.name === playerName && !p.connected);
  if (disconnectedPlayer) {
    disconnectedPlayer.connected = true;
    return { room, playerId: disconnectedPlayer.id };
  }

  if (room.gameState && room.gameState.phase !== 'lobby') return { error: '游戏已经开始' };

  const duplicate = room.players.find(p => p.name === playerName);
  if (duplicate) return { error: '该昵称已被使用' };

  // Check if avatar is already taken
  const targetAvatar = avatar ?? Math.floor(Math.random() * 16);
  if (room.players.some(p => p.avatar === targetAvatar && p.connected)) {
    return { error: '该头像已被其他玩家使用，请选择其他头像' };
  }

  const playerId = uuid();
  const player: Player = {
    id: playerId,
    name: playerName,
    seatIndex: room.players.length,
    connected: true,
    avatar: targetAvatar,
  };

  room.players.push(player);
  return { room, playerId };
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function removePlayerFromRoom(roomId: string, playerId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);

  // Reassign seat indices
  room.players.forEach((p, i) => { p.seatIndex = i; });

  // If host left, assign new host
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
  }

  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return null;
  }

  return room;
}

export function setPlayerConnected(roomId: string, playerId: string, connected: boolean): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players.find(p => p.id === playerId);
  if (player) player.connected = connected;
}

export function findPlayerRoom(playerId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === playerId)) {
      return room;
    }
  }
  return null;
}

export function resetRoomGame(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  room.gameState = null;
}

export function getAllRooms(): Map<string, Room> {
  return rooms;
}
