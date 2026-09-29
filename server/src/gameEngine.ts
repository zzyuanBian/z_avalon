import type { GameState, Player, RoleAssignment, Alignment, Role, MissionResult, LogEntry, KnownPlayers } from '../../shared/types.js';
import { ROLE_CONFIGS, TEAM_SIZES, failsRequired, WINS_NEEDED, MAX_CONSECUTIVE_REJECTIONS } from '../../shared/constants.js';
import { shuffle } from './utils.js';

export class GameEngine {
  state: GameState;
  onGameOver: ((state: GameState) => void) | null = null;

  constructor(roomId: string, players: Player[], hostId: string, roomName: string = '') {
    this.state = {
      roomId,
      roomName,
      phase: 'lobby',
      players: players.map(p => ({ ...p, connected: true })),
      roles: [],
      knownPlayers: {},
      currentRound: 1,
      missionResults: [],
      leaderIndex: 0,
      consecutiveRejections: 0,
      proposedTeam: [],
      votes: {},
      voteHistory: [],
      questDecisions: {},
      winner: null,
      winReason: null,
      assassinationTarget: null,
      hostId,
      log: [],
      readyPlayers: [],
      createdAt: Date.now(),
    };
  }

  startGame(): void {
    const playerCount = this.state.players.length;
    if (playerCount < 5 || playerCount > 10) {
      throw new Error('需要5-10名玩家');
    }
    if (this.state.phase !== 'lobby') {
      throw new Error('游戏无法开始');
    }

    // Shuffle players for seat assignment
    const shuffled = shuffle(this.state.players);
    shuffled.forEach((p, i) => { p.seatIndex = i; });
    this.state.players = shuffled;

    // Random first leader
    this.state.leaderIndex = Math.floor(Math.random() * playerCount);

    // Assign roles
    this.assignRoles();

    // Compute visibility
    this.computeVisibility();

    // Set phase
    this.state.phase = 'role_reveal';
    this.state.readyPlayers = [];

    this.addLog('role_reveal', '游戏开始！请查看你的身份牌。');
  }

  private assignRoles(): void {
    const playerCount = this.state.players.length;
    const config = ROLE_CONFIGS[playerCount];
    if (!config) throw new Error(`不支持${playerCount}人游戏`);

    const allRoles: Role[] = shuffle([...config.good, ...config.evil]);
    this.state.roles = allRoles.map((role, i) => ({
      playerId: this.state.players[i].id,
      role,
      alignment: this.getAlignment(role),
    }));
  }

  private getAlignment(role: Role): Alignment {
    const evilRoles: Role[] = ['morgana', 'assassin', 'minion_of_mordred', 'oberon'];
    return evilRoles.includes(role) ? 'evil' : 'good';
  }

  private computeVisibility(): void {
    const allRoles = this.state.roles;
    this.state.knownPlayers = {};

    for (const assignment of allRoles) {
      const known: KnownPlayers = {};

      switch (assignment.role) {
        case 'merlin':
          // Sees all evil EXCEPT Oberon
          for (const other of allRoles) {
            if (other.playerId === assignment.playerId) continue;
            if (other.alignment === 'evil' && other.role !== 'oberon') {
              known[other.playerId] = '邪恶';
            }
          }
          break;

        case 'percival':
          // Sees Merlin and Morgana both labeled "Merlin?"
          for (const other of allRoles) {
            if (other.playerId === assignment.playerId) continue;
            if (other.role === 'merlin' || other.role === 'morgana') {
              known[other.playerId] = '梅林?';
            }
          }
          break;

        case 'morgana':
        case 'assassin':
        case 'minion_of_mordred':
          // Evil sees other evil EXCEPT Oberon
          for (const other of allRoles) {
            if (other.playerId === assignment.playerId) continue;
            if (other.alignment === 'evil' && other.role !== 'oberon') {
              known[other.playerId] = '邪恶队友';
            }
          }
          break;

        case 'oberon':
        case 'loyal_servant':
          // See nobody
          break;
      }

      this.state.knownPlayers[assignment.playerId] = known;
    }
  }

  playerReady(playerId: string): void {
    if (this.state.phase !== 'role_reveal') {
      throw new Error('当前阶段无法准备');
    }
    if (this.state.readyPlayers.includes(playerId)) {
      throw new Error('你已经准备了');
    }

    this.state.readyPlayers.push(playerId);

    if (this.state.readyPlayers.length === this.state.players.length) {
      this.state.phase = 'team_selection';
      this.state.currentRound = 1;
      const leader = this.state.players[this.state.leaderIndex];
      this.addLog('round_start', `第1轮开始！${leader.name} 是队长，请提名队伍。`);
    }
  }

  proposeTeam(playerId: string, team: string[]): void {
    if (this.state.phase !== 'team_selection') {
      throw new Error('当前不是提名阶段');
    }

    const leader = this.state.players[this.state.leaderIndex];
    if (leader.id !== playerId) {
      throw new Error('只有队长可以提名队伍');
    }

    const requiredSize = this.getRequiredTeamSize();
    if (team.length !== requiredSize) {
      throw new Error(`队伍人数必须是 ${requiredSize} 人`);
    }

    // Validate all IDs are valid players
    const validIds = new Set(this.state.players.map(p => p.id));
    for (const id of team) {
      if (!validIds.has(id)) {
        throw new Error('队伍中包含无效的玩家');
      }
    }

    // Check for duplicates
    if (new Set(team).size !== team.length) {
      throw new Error('队伍中有重复的玩家');
    }

    this.state.proposedTeam = team;
    this.state.votes = {};
    this.state.phase = 'voting';

    const teamNames = team.map(id => {
      const p = this.state.players.find(pl => pl.id === id);
      return p?.name || '?';
    }).join('、');
    this.addLog('team_proposed', `${leader.name} 提名的队伍：${teamNames}`);
  }

  submitVote(playerId: string, approve: boolean): void {
    if (this.state.phase !== 'voting') {
      throw new Error('当前不是投票阶段');
    }
    if (this.state.votes[playerId] !== undefined) {
      throw new Error('你已经投过票了');
    }

    this.state.votes[playerId] = approve;

    // Check if all votes are in
    if (Object.keys(this.state.votes).length === this.state.players.length) {
      this.state.phase = 'vote_reveal';
      // Auto-resolve after delay (handled by socket handler)
    }
  }

  resolveVote(): void {
    if (this.state.phase !== 'vote_reveal') return;

    const approveCount = Object.values(this.state.votes).filter(v => v).length;
    const rejectCount = this.state.players.length - approveCount;
    const approved = approveCount > rejectCount;

    // Record vote history
    this.state.voteHistory.push({ approveCount, rejectCount, approved });

    // Clear votes for anonymity (no per-player tracking)
    this.state.votes = {};

    if (approved) {
      this.state.consecutiveRejections = 0;
      this.state.questDecisions = {};
      this.state.phase = 'quest';

      const teamNames = this.state.proposedTeam.map(id => {
        const p = this.state.players.find(pl => pl.id === id);
        return p?.name || '?';
      }).join('、');
      this.addLog('vote_result',
        `投票结果：${approveCount} 同意 / ${rejectCount} 拒绝。队伍通过！执行任务中...`);
    } else {
      this.state.consecutiveRejections++;

      this.addLog('vote_result',
        `投票结果：${approveCount} 同意 / ${rejectCount} 拒绝。队伍被拒绝！`);

      if (this.state.consecutiveRejections >= MAX_CONSECUTIVE_REJECTIONS) {
        this.state.winner = 'evil';
        this.state.winReason = `连续 ${MAX_CONSECUTIVE_REJECTIONS} 次拒绝投票，邪恶方获胜！`;
        this.state.phase = 'game_over';
        this.addLog('game_over', this.state.winReason);
        this.notifyGameOver();
        return;
      }

      this.advanceLeader();
      this.state.phase = 'team_selection';
      const leader = this.state.players[this.state.leaderIndex];
      this.addLog('round_start',
        `队长轮换至 ${leader.name}，请提名新队伍。`);
    }
  }

  submitQuestDecision(playerId: string, success: boolean): void {
    if (this.state.phase !== 'quest') {
      throw new Error('当前不是任务阶段');
    }
    if (!this.state.proposedTeam.includes(playerId)) {
      throw new Error('你不在任务队伍中');
    }
    if (this.state.questDecisions[playerId] !== undefined) {
      throw new Error('你已经做过决定');
    }

    // Server-side enforcement: good players MUST play success
    const role = this.state.roles.find(r => r.playerId === playerId);
    if (!role) throw new Error('找不到玩家角色');
    if (role.alignment === 'good') {
      success = true;
    }

    this.state.questDecisions[playerId] = success;

    // Check if all team members have decided
    if (Object.keys(this.state.questDecisions).length === this.state.proposedTeam.length) {
      this.resolveQuest();
    }
  }

  private resolveQuest(): void {
    const failCount = Object.values(this.state.questDecisions).filter(v => !v).length;
    const successCount = this.state.proposedTeam.length - failCount;
    const requiredFails = failsRequired(this.state.players.length, this.state.currentRound);
    const success = failCount < requiredFails;

    const leader = this.state.players[this.state.leaderIndex];
    const result: MissionResult = {
      round: this.state.currentRound,
      success,
      failCount,
      successCount,
      team: [...this.state.proposedTeam],
      leader: leader.id,
    };

    this.state.missionResults.push(result);
    // Clear quest decisions for anonymity
    this.state.questDecisions = {};
    this.state.phase = 'quest_result';

    const goodWins = this.state.missionResults.filter(r => r.success).length;
    const evilWins = this.state.missionResults.filter(r => !r.success).length;

    this.addLog('quest_result',
      `第${this.state.currentRound}轮任务${success ? '成功' : '失败'}！` +
      `${successCount} 成功 / ${failCount} 失败。当前：${goodWins} 成功 / ${evilWins} 失败`);
  }

  advanceAfterQuestResult(): void {
    if (this.state.phase !== 'quest_result') return;

    const goodWins = this.state.missionResults.filter(r => r.success).length;
    const evilWins = this.state.missionResults.filter(r => !r.success).length;

    // Check win conditions
    if (goodWins >= WINS_NEEDED) {
      const hasAssassin = this.state.roles.some(r => r.role === 'assassin');
      if (hasAssassin) {
        this.state.phase = 'assassination';
        this.addLog('quest_result',
          '善良方获得3次任务成功！刺客请选择刺杀目标...');
      } else {
        this.state.winner = 'good';
        this.state.winReason = '善良方完成3次任务，获胜！';
        this.state.phase = 'game_over';
        this.addLog('game_over', this.state.winReason);
        this.notifyGameOver();
      }
      return;
    }

    if (evilWins >= WINS_NEEDED) {
      this.state.winner = 'evil';
      this.state.winReason = '邪恶方破坏了3次任务，获胜！';
      this.state.phase = 'game_over';
      this.addLog('game_over', this.state.winReason);
      this.notifyGameOver();
      return;
    }

    // Next round
    this.state.currentRound++;
    this.advanceLeader();
    this.state.phase = 'team_selection';
    const newLeader = this.state.players[this.state.leaderIndex];
    this.addLog('round_start',
      `第${this.state.currentRound}轮开始！${newLeader.name} 是队长，请提名队伍。`);
  }

  assassinate(playerId: string, targetId: string): void {
    if (this.state.phase !== 'assassination') {
      throw new Error('当前不是刺杀阶段');
    }

    const assassin = this.state.roles.find(r => r.playerId === playerId);
    if (!assassin || assassin.role !== 'assassin') {
      throw new Error('只有刺客可以刺杀');
    }

    const target = this.state.roles.find(r => r.playerId === targetId);
    if (!target) throw new Error('目标玩家不存在');

    this.state.assassinationTarget = targetId;

    const targetPlayer = this.state.players.find(p => p.id === targetId);
    const targetName = targetPlayer?.name || '?';

    if (target.role === 'merlin') {
      this.state.winner = 'evil';
      this.state.winReason = `刺客 ${assassin.playerId === playerId ? '正确' : ''}刺杀了梅林（${targetName}）！邪恶方获胜！`;
    } else {
      this.state.winner = 'good';
      this.state.winReason = `刺客刺杀了 ${targetName}（${target.role === 'loyal_servant' ? '忠诚骑士' : target.role}），不是梅林！善良方获胜！`;
    }

    this.state.phase = 'game_over';
    this.addLog('game_over', this.state.winReason);
    this.notifyGameOver();
  }

  private advanceLeader(): void {
    this.state.leaderIndex = (this.state.leaderIndex + 1) % this.state.players.length;
  }

  private getRequiredTeamSize(): number {
    const playerCount = this.state.players.length;
    const roundIndex = this.state.currentRound - 1;
    return TEAM_SIZES[playerCount]?.[roundIndex] ?? 0;
  }

  getRequiredTeamSizePublic(): number {
    return this.getRequiredTeamSize();
  }

  private notifyGameOver(): void {
    if (this.onGameOver && this.state.phase === 'game_over') {
      this.onGameOver(this.state);
    }
  }

  private addLog(type: LogEntry['type'], message: string): void {
    this.state.log.push({
      timestamp: Date.now(),
      type,
      message,
    });
  }

  resetGame(): void {
    this.state.phase = 'lobby';
    this.state.roles = [];
    this.state.knownPlayers = {};
    this.state.currentRound = 1;
    this.state.missionResults = [];
    this.state.leaderIndex = 0;
    this.state.consecutiveRejections = 0;
    this.state.proposedTeam = [];
    this.state.votes = {};
    this.state.questDecisions = {};
    this.state.winner = null;
    this.state.winReason = null;
    this.state.assassinationTarget = null;
    this.state.log = [];
    this.state.readyPlayers = [];
  }
}
