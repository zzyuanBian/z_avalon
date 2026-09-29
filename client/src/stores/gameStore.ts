import { create } from 'zustand';
import type { PlayerView, RoleConfig, PropType } from '@shared/types';
import { getSocket, connectSocket } from '../socket';

interface GameStore {
  // Connection state
  playerId: string | null;
  playerName: string | null;
  roomId: string | null;
  connected: boolean;

  // Game state from server
  view: PlayerView | null;

  // Local UI state
  selectedTeam: string[];
  hasVoted: boolean;
  hasDecidedQuest: boolean;
  error: string | null;
  playerMarks: Record<string, string[]>; // playerId → array of mark labels

  // Actions
  setPlayerInfo: (playerId: string, playerName: string, roomId: string, avatar: number) => void;
  setConnected: (connected: boolean) => void;
  updateView: (view: PlayerView) => void;
  setError: (error: string | null) => void;
  togglePlayerMark: (playerId: string, mark: string) => void;

  // Game actions
  createRoom: (playerName: string, roomName?: string, avatar?: number) => void;
  joinRoom: (roomId: string, playerName: string, avatar?: number) => void;
  leaveRoom: () => void;
  kickPlayer: (targetId: string) => void;
  reconnect: (roomId: string, playerId: string) => void;
  startGame: () => void;
  ready: () => void;
  toggleTeamMember: (playerId: string) => void;
  proposeTeam: () => void;
  submitVote: (approve: boolean) => void;
  submitQuestDecision: (success: boolean) => void;
  assassinate: (targetId: string) => void;
  submitFunVote: (targetId: string) => void;
  playAgain: () => void;
  setRoleConfig: (config: RoleConfig) => void;
  sendChatMessage: (message: string) => void;
  throwProp: (targetId: string, propType: PropType) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  playerId: null,
  playerName: null,
  roomId: null,
  connected: false,
  view: null,
  selectedTeam: [],
  hasVoted: false,
  hasDecidedQuest: false,
  error: null,
  playerMarks: {},

  setPlayerInfo: (playerId, playerName, roomId, avatar) => {
    set({ playerId, playerName, roomId });
    // Save for reconnection
    try {
      sessionStorage.setItem('avalon_playerId', playerId);
      sessionStorage.setItem('avalon_playerName', playerName);
      sessionStorage.setItem('avalon_roomId', roomId);
      sessionStorage.setItem('avalon_avatar', String(avatar));
    } catch {}
  },

  setConnected: (connected) => set({ connected }),

  updateView: (view) => {
    const current = get().view;
    // Reset local state on phase change
    if (current?.phase !== view.phase) {
      set({
        view,
        selectedTeam: [],
        hasVoted: view.phase === 'voting' ? false : get().hasVoted,
        hasDecidedQuest: view.phase === 'quest' ? false : get().hasDecidedQuest,
      });
    } else {
      set({ view });
    }
  },

  setError: (error) => set({ error }),

  togglePlayerMark: (playerId, mark) => {
    const { playerMarks } = get();
    const current = playerMarks[playerId] || [];
    const updated = current.includes(mark)
      ? current.filter(m => m !== mark)
      : [...current, mark];
    set({
      playerMarks: {
        ...playerMarks,
        [playerId]: updated,
      },
    });
  },

  createRoom: (playerName, roomName, avatar) => {
    const socket = connectSocket();
    set({ connected: true, playerName });
    // Wait for connection if not connected
    if (!socket.connected) {
      socket.once('connect', () => {
        socket.send('room:create', { playerName, roomName: roomName || '', avatar: avatar ?? 0 });
      });
    } else {
      socket.send('room:create', { playerName, roomName: roomName || '', avatar: avatar ?? 0 });
    }
  },

  joinRoom: (roomId, playerName, avatar) => {
    const socket = connectSocket();
    set({ connected: true, playerName, roomId });
    if (!socket.connected) {
      socket.once('connect', () => {
        socket.send('room:join', { roomId, playerName, avatar: avatar ?? 0 });
      });
    } else {
      socket.send('room:join', { roomId, playerName, avatar: avatar ?? 0 });
    }
  },

  leaveRoom: () => {
    const socket = getSocket();
    socket.send('room:leave');
    set({ playerId: null, playerName: null, roomId: null, view: null });
    try {
      sessionStorage.removeItem('avalon_playerId');
      sessionStorage.removeItem('avalon_playerName');
      sessionStorage.removeItem('avalon_roomId');
      sessionStorage.removeItem('avalon_avatar');
    } catch {}
  },

  kickPlayer: (targetId) => {
    getSocket().send('room:kick', { targetId });
  },

  reconnect: (roomId, playerId) => {
    const socket = connectSocket();
    set({ connected: true });
    socket.send('room:reconnect', { roomId, playerId });
  },

  startGame: () => {
    getSocket().send('game:start');
  },

  ready: () => {
    getSocket().send('game:ready');
  },

  toggleTeamMember: (playerId) => {
    const { selectedTeam, view } = get();
    if (!view) return;

    if (selectedTeam.includes(playerId)) {
      set({ selectedTeam: selectedTeam.filter(id => id !== playerId) });
    } else {
      if (selectedTeam.length < view.teamSize) {
        set({ selectedTeam: [...selectedTeam, playerId] });
      }
    }
  },

  proposeTeam: () => {
    const { selectedTeam } = get();
    getSocket().send('game:propose-team', { team: selectedTeam });
    set({ selectedTeam: [] });
  },

  submitVote: (approve) => {
    getSocket().send('game:vote', { approve });
    set({ hasVoted: true });
  },

  submitQuestDecision: (success) => {
    getSocket().send('game:quest-decide', { success });
    set({ hasDecidedQuest: true });
  },

  assassinate: (targetId) => {
    getSocket().send('game:assassinate', { target: targetId });
  },

  submitFunVote: (targetId) => {
    getSocket().send('game:fun-vote', { target: targetId });
  },

  playAgain: () => {
    getSocket().send('game:play-again');
  },

  setRoleConfig: (config) => {
    getSocket().send('game:set-role-config', { config });
  },

  sendChatMessage: (message) => {
    getSocket().send('chat:send', { message });
  },

  throwProp: (targetId, propType) => {
    getSocket().send('prop:throw', { targetId, propType });
  },
}));
