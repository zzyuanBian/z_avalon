export type Alignment = 'good' | 'evil';

export type Role =
  | 'merlin'
  | 'percival'
  | 'loyal_servant'
  | 'morgana'
  | 'assassin'
  | 'minion_of_mordred'
  | 'oberon';

export type GamePhase =
  | 'lobby'
  | 'role_reveal'
  | 'team_selection'
  | 'voting'
  | 'vote_reveal'
  | 'quest'
  | 'quest_result'
  | 'assassination'
  | 'game_over';

export interface Player {
  id: string;
  name: string;
  seatIndex: number;
  connected: boolean;
}

export interface RoleAssignment {
  playerId: string;
  role: Role;
  alignment: Alignment;
}

export interface KnownPlayers {
  [playerId: string]: string;
}

export interface MissionResult {
  round: number;
  success: boolean;
  failCount: number;
  team: string[];
  leader: string;
}

export interface LogEntry {
  timestamp: number;
  type: 'round_start' | 'team_proposed' | 'vote_result'
      | 'quest_result' | 'role_reveal' | 'game_over';
  message: string;
  data?: Record<string, unknown>;
}

export interface GameState {
  roomId: string;
  roomName: string;
  phase: GamePhase;
  players: Player[];
  roles: RoleAssignment[];
  knownPlayers: { [playerId: string]: KnownPlayers };
  currentRound: number;
  missionResults: MissionResult[];
  leaderIndex: number;
  consecutiveRejections: number;
  proposedTeam: string[];
  votes: { [playerId: string]: boolean };
  questDecisions: { [playerId: string]: boolean };
  winner: Alignment | null;
  winReason: string | null;
  assassinationTarget: string | null;
  hostId: string;
  log: LogEntry[];
  readyPlayers: string[];
  createdAt: number;
}

export interface PlayerView {
  roomId: string;
  roomName: string;
  phase: GamePhase;
  players: Player[];
  myRole: Role | null;
  myAlignment: Alignment | null;
  knownPlayers: KnownPlayers;
  currentRound: number;
  missionResults: MissionResult[];
  leaderIndex: number;
  consecutiveRejections: number;
  proposedTeam: string[];
  teamSize: number;
  votesSubmitted: number;
  totalPlayers: number;
  allVotesIn: boolean;
  votes?: { [playerId: string]: boolean };
  questResult?: { success: boolean; failCount: number };
  winner: Alignment | null;
  winReason: string | null;
  allRoles?: RoleAssignment[];
  isLeader: boolean;
  isOnTeam: boolean;
  canAct: boolean;
  log: LogEntry[];
  hostId: string;
  readyCount: number;
}

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string }) => void;
  'room:join': (data: { roomId: string; playerName: string }) => void;
  'room:leave': () => void;
  'room:reconnect': (data: { roomId: string; playerId: string }) => void;
  'game:start': () => void;
  'game:ready': () => void;
  'game:propose-team': (data: { team: string[] }) => void;
  'game:vote': (data: { approve: boolean }) => void;
  'game:quest-decide': (data: { success: boolean }) => void;
  'game:assassinate': (data: { target: string }) => void;
  'game:play-again': () => void;
}

export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; playerId: string }) => void;
  'room:joined': (data: { playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'game:state': (view: PlayerView) => void;
  'game:error': (data: { message: string }) => void;
}
