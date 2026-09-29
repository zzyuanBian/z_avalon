import type { WebSocket, WebSocketServer } from 'ws';
import type { PlayerView } from '../../shared/types.js';
import { createRoom, joinRoom, getRoom, removePlayerFromRoom, setPlayerConnected, resetRoomGame } from './roomManager.js';
import { GameEngine } from './gameEngine.js';
import { buildPlayerView } from './viewBuilder.js';
import { saveGameStart, saveGameEnd } from './database.js';

const engines = new Map<string, GameEngine>();
const voteTimers = new Map<string, ReturnType<typeof setTimeout>>();
const questTimers = new Map<string, ReturnType<typeof setTimeout>>();
// Track which players have submitted quest decisions (prevents duplicate messages)
const questSubmitted = new Map<string, Set<string>>(); // roomId → Set<playerId>
// Rate limits for chat (playerId → last timestamp)
const chatRateLimits = new Map<string, number>();
// Rate limits for props (playerId → last timestamp)
const propRateLimits = new Map<string, number>();

// Map WebSocket -> { roomId, playerId }
const wsMap = new Map<WebSocket, { roomId: string; playerId: string }>();
// Map roomId -> Set<WebSocket>
const roomSockets = new Map<string, Set<WebSocket>>();

interface WsMessage {
  type: string;
  data?: any;
}

function send(ws: WebSocket, type: string, data: any): void {
  if (ws.readyState === 1) { // OPEN
    ws.send(JSON.stringify({ type, data }));
  }
}

function broadcastToRoom(roomId: string, type: string, data: any): void {
  const sockets = roomSockets.get(roomId);
  if (!sockets) return;
  const msg = JSON.stringify({ type, data });
  for (const ws of sockets) {
    if (ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function emitGameStates(roomId: string): void {
  const room = getRoom(roomId);
  if (!room?.gameState) return;

  const engine = engines.get(roomId);
  if (!engine) return;

  const sockets = roomSockets.get(roomId);
  if (!sockets) return;

  for (const player of room.players) {
    const view = buildPlayerView(engine.state, player.id);
    // Find WebSocket for this player
    for (const ws of sockets) {
      const info = wsMap.get(ws);
      if (info && info.playerId === player.id) {
        send(ws, 'game:state', view);
      }
    }
  }
}

function joinWsRoom(ws: WebSocket, roomId: string): void {
  if (!roomSockets.has(roomId)) {
    roomSockets.set(roomId, new Set());
  }
  roomSockets.get(roomId)!.add(ws);
}

function leaveWsRoom(ws: WebSocket, roomId: string): void {
  const sockets = roomSockets.get(roomId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      roomSockets.delete(roomId);
    }
  }
}

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws) => {
    console.log(`[ws:connect] new connection`);

    // Heartbeat
    (ws as any).isAlive = true;
    ws.on('pong', () => { (ws as any).isAlive = true; });

    ws.on('message', (raw) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        send(ws, 'error', { message: '消息格式错误' });
        return;
      }

      handleMessage(ws, msg);
    });

    ws.on('close', () => {
      const info = wsMap.get(ws);
      if (info) {
        setPlayerConnected(info.roomId, info.playerId, false);
        leaveWsRoom(ws, info.roomId);
      }
      wsMap.delete(ws);
      console.log(`[ws:disconnect]`);
    });

    ws.on('error', (err) => {
      console.error(`[ws:error]`, err.message);
    });
  });

  // Heartbeat interval - detect dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        return;
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));
}

function handleMessage(ws: WebSocket, msg: WsMessage): void {
  const { type, data } = msg;

  switch (type) {
    case 'room:create': handleRoomCreate(ws, data); break;
    case 'room:join': handleRoomJoin(ws, data); break;
    case 'room:leave': handleRoomLeave(ws); break;
    case 'room:reconnect': handleReconnect(ws, data); break;
    case 'game:start': handleGameStart(ws); break;
    case 'game:ready': handleGameReady(ws); break;
    case 'game:propose-team': handleProposeTeam(ws, data); break;
    case 'game:vote': handleVote(ws, data); break;
    case 'game:quest-decide': handleQuestDecide(ws, data); break;
    case 'game:assassinate': handleAssassinate(ws, data); break;
    case 'game:fun-vote': handleFunVote(ws, data); break;
    case 'game:play-again': handlePlayAgain(ws); break;
    case 'game:set-role-config': handleSetRoleConfig(ws, data); break;
    case 'chat:send': handleChatSend(ws, data); break;
    case 'prop:throw': handlePropThrow(ws, data); break;
    default:
      send(ws, 'error', { message: `未知消息类型: ${type}` });
  }
}

function handleRoomCreate(ws: WebSocket, data: any): void {
  const name = (data?.playerName || '').trim();
  const roomName = (data?.roomName || '').trim();
  const avatar = typeof data?.avatar === 'number' ? data.avatar : undefined;
  if (!name || name.length > 20) {
    send(ws, 'room:error', { message: '昵称需要1-20个字符' });
    return;
  }

  const { room, playerId } = createRoom(name, roomName, avatar);
  wsMap.set(ws, { roomId: room.id, playerId });
  joinWsRoom(ws, room.id);

  // Create engine immediately for lobby state
  const engine = new GameEngine(room.id, room.players, room.hostId, room.name);
  engine.onGameOver = (state) => saveGameEnd(state);
  room.gameState = engine.state;
  engines.set(room.id, engine);

  send(ws, 'room:created', { roomId: room.id, playerId });

  // Send lobby state
  const view = buildPlayerView(engine.state, playerId);
  send(ws, 'game:state', view);

  console.log(`[room:create] ${room.id} (${room.name}) by ${name}`);
}

function handleRoomJoin(ws: WebSocket, data: any): void {
  const name = (data?.playerName || '').trim();
  const roomId = (data?.roomId || '').toUpperCase().trim();
  const avatar = typeof data?.avatar === 'number' ? data.avatar : undefined;

  if (!name || name.length > 20) {
    send(ws, 'room:error', { message: '昵称需要1-20个字符' });
    return;
  }

  const result = joinRoom(roomId, name, avatar);
  if ('error' in result) {
    send(ws, 'room:error', { message: result.error });
    return;
  }

  const { room, playerId } = result;

  // Close any old WebSocket for this player (reconnection mid-game)
  const sockets = roomSockets.get(room.id);
  if (sockets) {
    for (const oldWs of sockets) {
      const info = wsMap.get(oldWs);
      if (info && info.playerId === playerId && oldWs !== ws) {
        oldWs.close(1000, 'rejoin');
        wsMap.delete(oldWs);
        sockets.delete(oldWs);
      }
    }
  }

  wsMap.set(ws, { roomId: room.id, playerId });
  joinWsRoom(ws, room.id);

  send(ws, 'room:joined', { playerId });

  // Update engine players and emit state to all
  const engine = engines.get(room.id);
  if (engine) {
    engine.state.players = room.players.map(p => ({ ...p, connected: true }));
    emitGameStates(room.id);
  }
  console.log(`[room:join] ${room.id} by ${name} (playerId: ${playerId})`);
}

function handleRoomLeave(ws: WebSocket): void {
  const info = wsMap.get(ws);
  if (!info) return;

  removePlayerFromRoom(info.roomId, info.playerId);
  leaveWsRoom(ws, info.roomId);
  wsMap.delete(ws);
}

function handleReconnect(ws: WebSocket, data: any): void {
  const room = getRoom(data?.roomId);
  if (!room) {
    send(ws, 'room:error', { message: '房间不存在' });
    return;
  }

  const player = room.players.find(p => p.id === data.playerId);
  if (!player) {
    send(ws, 'room:error', { message: '玩家不在此房间' });
    return;
  }

  // Close any old WebSocket connection for this player
  const sockets = roomSockets.get(data.roomId);
  if (sockets) {
    for (const oldWs of sockets) {
      const info = wsMap.get(oldWs);
      if (info && info.playerId === data.playerId && oldWs !== ws) {
        oldWs.close(1000, 'reconnect');
        wsMap.delete(oldWs);
        sockets.delete(oldWs);
      }
    }
  }

  setPlayerConnected(data.roomId, data.playerId, true);
  wsMap.set(ws, { roomId: data.roomId, playerId: data.playerId });
  joinWsRoom(ws, data.roomId);

  // Send current game state
  if (room.gameState) {
    const engine = engines.get(data.roomId);
    if (engine) {
      const view = buildPlayerView(engine.state, data.playerId);
      send(ws, 'game:state', view);
    }
  }
  console.log(`[reconnect] ${data.roomId} player ${data.playerId}`);
}

function handleGameStart(ws: WebSocket): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const room = getRoom(info.roomId);
  if (!room) return;

  if (room.hostId !== info.playerId) {
    send(ws, 'game:error', { message: '只有房主可以开始游戏' });
    return;
  }

  const playerCount = room.players.length;
  if (playerCount < 5 || playerCount > 10) {
    send(ws, 'game:error', { message: '需要5-10名玩家才能开始游戏' });
    return;
  }

  let engine = engines.get(info.roomId);
  if (!engine) {
    engine = new GameEngine(info.roomId, room.players, room.hostId);
    engine.onGameOver = (state) => saveGameEnd(state);
    engines.set(info.roomId, engine);
  }

  engine.state.players = room.players.map(p => ({ ...p, connected: true }));
  engine.startGame();
  room.gameState = engine.state;

  // Save game start
  saveGameStart(engine.state);

  emitGameStates(info.roomId);
  console.log(`[game:start] ${info.roomId} with ${playerCount} players`);
}

function handleGameReady(ws: WebSocket): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    engine.playerReady(info.playerId);
    emitGameStates(info.roomId);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handleProposeTeam(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    engine.proposeTeam(info.playerId, data.team);
    emitGameStates(info.roomId);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handleVote(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    engine.submitVote(info.playerId, data.approve);
    emitGameStates(info.roomId);

    // If all votes in, schedule auto-resolve
    if (engine.state.phase === 'vote_reveal') {
      if (voteTimers.has(info.roomId)) {
        clearTimeout(voteTimers.get(info.roomId)!);
      }
      voteTimers.set(info.roomId, setTimeout(() => {
        engine.resolveVote();
        emitGameStates(info.roomId);
        voteTimers.delete(info.roomId);
      }, 5000));
    }
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handleQuestDecide(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  // Deduplicate: ignore if this player already submitted for this quest
  let submitted = questSubmitted.get(info.roomId);
  if (!submitted) {
    submitted = new Set();
    questSubmitted.set(info.roomId, submitted);
  }
  if (submitted.has(info.playerId)) {
    console.log(`[quest-decide] duplicate from ${info.playerId.slice(0,8)}, ignoring`);
    return;
  }
  submitted.add(info.playerId);

  try {
    engine.submitQuestDecision(info.playerId, data.success);
    emitGameStates(info.roomId);

    // If all decisions in, start quest result display timer
    if (engine.state.phase === 'quest_result') {
      console.log(`[quest] all decisions in, starting 5s result timer for ${info.roomId}`);
      questSubmitted.delete(info.roomId); // Clean up
      questTimers.set(info.roomId, setTimeout(() => {
        engine.advanceAfterQuestResult();
        emitGameStates(info.roomId);
        questTimers.delete(info.roomId);
      }, 5000));
    }
  } catch (e) {
    console.error(`[quest-decide] error:`, (e as Error).message);
    submitted.delete(info.playerId); // Allow retry on error
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handleAssassinate(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    engine.assassinate(info.playerId, data.target);
    emitGameStates(info.roomId);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handleFunVote(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    engine.submitFunVote(info.playerId, data.target);
    emitGameStates(info.roomId);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handlePlayAgain(ws: WebSocket): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const room = getRoom(info.roomId);
  if (!room) return;

  if (room.hostId !== info.playerId) {
    send(ws, 'game:error', { message: '只有房主可以重新开始' });
    return;
  }

  // Clear timers
  if (voteTimers.has(info.roomId)) {
    clearTimeout(voteTimers.get(info.roomId)!);
    voteTimers.delete(info.roomId);
  }
  if (questTimers.has(info.roomId)) {
    clearTimeout(questTimers.get(info.roomId)!);
    questTimers.delete(info.roomId);
  }
  questSubmitted.delete(info.roomId);

  const engine = engines.get(info.roomId);
  if (engine) {
    engine.resetGame();
    room.gameState = engine.state;
    emitGameStates(info.roomId);
  }
  console.log(`[play-again] ${info.roomId}`);
}

function handleSetRoleConfig(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    engine.setRoleConfig(info.playerId, data.config);
    emitGameStates(info.roomId);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handleChatSend(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  // Rate limit: 1 message per second
  const now = Date.now();
  const last = chatRateLimits.get(info.playerId) || 0;
  if (now - last < 1000) return;
  chatRateLimits.set(info.playerId, now);

  const engine = engines.get(info.roomId);
  if (!engine) return;

  try {
    const chatMsg = engine.sendChatMessage(info.playerId, data.message);
    broadcastToRoom(info.roomId, 'chat:message', chatMsg);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}

function handlePropThrow(ws: WebSocket, data: any): void {
  const info = wsMap.get(ws);
  if (!info) return;

  // Rate limit: 1 prop per 2 seconds
  const now = Date.now();
  const last = propRateLimits.get(info.playerId) || 0;
  if (now - last < 2000) return;
  propRateLimits.set(info.playerId, now);

  const engine = engines.get(info.roomId);
  if (!engine) return;

  const room = getRoom(info.roomId);
  if (!room) return;

  try {
    engine.throwProp(info.playerId, data.targetId, data.propType);
    const player = room.players.find(p => p.id === info.playerId);
    broadcastToRoom(info.roomId, 'prop:thrown', {
      fromId: info.playerId,
      fromName: player?.name || '?',
      targetId: data.targetId,
      propType: data.propType,
    });
    // Update state to reflect remaining props
    emitGameStates(info.roomId);
  } catch (e) {
    send(ws, 'game:error', { message: (e as Error).message });
  }
}
