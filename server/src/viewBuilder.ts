import type { GameState, PlayerView, RoleAssignment } from '../../shared/types.js';

export function buildPlayerView(state: GameState, playerId: string): PlayerView {
  const myRole = state.roles.find(r => r.playerId === playerId) || null;
  const isLeader = state.players[state.leaderIndex]?.id === playerId;
  const isOnTeam = state.proposedTeam.includes(playerId);

  const teamSize = getTeamSize(state.players.length, state.currentRound);

  // Base view - public info
  const view: PlayerView = {
    roomId: state.roomId,
    roomName: state.roomName || '',
    phase: state.phase,
    players: state.players.map(p => ({ ...p })),
    myRole: myRole?.role || null,
    myAlignment: myRole?.alignment || null,
    knownPlayers: state.knownPlayers[playerId] || {},
    currentRound: state.currentRound,
    missionResults: state.missionResults.map(r => ({ ...r })),
    leaderIndex: state.leaderIndex,
    consecutiveRejections: state.consecutiveRejections,
    proposedTeam: [...state.proposedTeam],
    teamSize,
    votesSubmitted: Object.keys(state.votes).length,
    totalPlayers: state.players.length,
    allVotesIn: Object.keys(state.votes).length === state.players.length,
    voteHistory: state.voteHistory.map(v => ({ ...v })),
    winner: state.winner,
    winReason: state.winReason,
    funVotesSubmitted: Object.keys(state.funVotes).length,
    funVoteResult: null,
    isLeader,
    isOnTeam,
    canAct: false,
    log: state.log.map(l => ({ ...l })),
    hostId: state.hostId,
    readyCount: state.readyPlayers.length,
  };

  // Phase-specific data filtering
  switch (state.phase) {
    case 'voting':
      view.canAct = state.votes[playerId] === undefined;
      break;

    case 'vote_reveal': {
      // Anonymous: only show aggregate counts
      const approveCount = Object.values(state.votes).filter(v => v).length;
      const rejectCount = state.players.length - approveCount;
      view.voteResult = { approveCount, rejectCount, approved: approveCount > rejectCount };
      view.canAct = false;
      break;
    }

    case 'quest':
      view.canAct = isOnTeam && state.questDecisions[playerId] === undefined;
      break;

    case 'quest_result': {
      const lastResult = state.missionResults[state.missionResults.length - 1];
      if (lastResult) {
        view.questResult = {
          success: lastResult.success,
          failCount: lastResult.failCount,
          successCount: lastResult.successCount,
          teamSize: lastResult.team.length,
        };
      }
      view.canAct = false;
      break;
    }

    case 'team_selection':
      view.canAct = isLeader;
      break;

    case 'assassination':
      view.canAct = myRole?.role === 'assassin';
      break;

    case 'game_over':
      // Reveal all roles
      view.allRoles = state.roles.map(r => ({ ...r }));
      view.funVotesSubmitted = Object.keys(state.funVotes).length;
      view.funVoteResult = state.funVoteResult
        ? state.funVoteResult.map(r => ({ ...r }))
        : null;
      view.canAct = state.funVotes[playerId] === undefined;
      break;

    case 'role_reveal':
      view.canAct = !state.readyPlayers.includes(playerId);
      break;

    default:
      view.canAct = false;
  }

  return view;
}

function getTeamSize(playerCount: number, round: number): number {
  const TEAM_SIZES: Record<number, number[]> = {
    5:  [2, 3, 2, 3, 3],
    6:  [2, 3, 4, 3, 4],
    7:  [2, 3, 3, 4, 4],
    8:  [3, 4, 4, 5, 5],
    9:  [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  };
  return TEAM_SIZES[playerCount]?.[round - 1] ?? 0;
}
