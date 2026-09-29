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

export interface RoleConfig {
  good: Role[];
  evil: Role[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export type PropType = 'flower' | 'egg';

export interface PropEvent {
  fromId: string;
  fromName: string;
  targetId: string;
  propType: PropType;
}

export interface Player {
  id: string;
  name: string;
  seatIndex: number;
  connected: boolean;
  avatar: number;
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
  successCount: number;
  team: string[];
  leader: string;
}

export interface VoteRecord {
  approveCount: number;
  rejectCount: number;
  approved: boolean;
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
  voteHistory: VoteRecord[];
  questDecisions: { [playerId: string]: boolean };
  funVotes: { [playerId: string]: string }; // voterId → targetId
  funVoteResult: { playerId: string; voteCount: number }[] | null;
  winner: Alignment | null;
  winReason: string | null;
  assassinationTarget: string | null;
  hostId: string;
  log: LogEntry[];
  readyPlayers: string[];
  createdAt: number;
  customRoleConfig: RoleConfig | null;
  chatMessages: ChatMessage[];
  propsUsed: Record<string, { flower: number; egg: number }>;
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
  votersSubmitted: string[];
  questDecidersSubmitted: string[];
  totalPlayers: number;
  allVotesIn: boolean;
  voteResult?: { approveCount: number; rejectCount: number; approved: boolean };
  voteHistory: VoteRecord[];
  questResult?: { success: boolean; failCount: number; successCount: number; teamSize: number };
  winner: Alignment | null;
  winReason: string | null;
  funVotesSubmitted: number;
  funVoteResult: { playerId: string; voteCount: number }[] | null;
  allRoles?: RoleAssignment[];
  isLeader: boolean;
  isOnTeam: boolean;
  canAct: boolean;
  log: LogEntry[];
  hostId: string;
  readyCount: number;
  roleConfig: RoleConfig;
  chatMessages: ChatMessage[];
  propsRemaining: { flower: number; egg: number };
}

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; avatar: number }) => void;
  'room:join': (data: { roomId: string; playerName: string; avatar: number }) => void;
  'room:leave': () => void;
  'room:reconnect': (data: { roomId: string; playerId: string }) => void;
  'game:start': () => void;
  'game:ready': () => void;
  'game:propose-team': (data: { team: string[] }) => void;
  'game:vote': (data: { approve: boolean }) => void;
  'game:quest-decide': (data: { success: boolean }) => void;
  'game:assassinate': (data: { target: string }) => void;
  'game:play-again': () => void;
  'game:fun-vote': (data: { target: string }) => void;
  'game:set-role-config': (data: { config: RoleConfig }) => void;
  'chat:send': (data: { message: string }) => void;
  'prop:throw': (data: { targetId: string; propType: PropType }) => void;
}

export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; playerId: string }) => void;
  'room:joined': (data: { playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'game:state': (view: PlayerView) => void;
  'game:error': (data: { message: string }) => void;
  'chat:message': (data: ChatMessage) => void;
  'prop:thrown': (data: PropEvent) => void;
}
