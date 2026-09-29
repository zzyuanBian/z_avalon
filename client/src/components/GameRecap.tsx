import type { RoundHistory, Player, RoleAssignment } from '@shared/types';
import { TEAM_SIZES, failsRequired } from '@shared/constants';
import { AvatarImage } from './Avatars';

interface GameRecapProps {
  roundHistory: RoundHistory[];
  players: Player[];
  allRoles?: RoleAssignment[];
  playerCount: number;
}

export default function GameRecap({ roundHistory, players, allRoles, playerCount }: GameRecapProps) {
  if (!roundHistory.length) return null;

  const getPlayer = (id: string) => players.find(p => p.id === id);
  const getAlignment = (id: string) => allRoles?.find(r => r.playerId === id)?.alignment;

  return (
    <div className="w-full max-w-sm mb-6">
      <h2 className="font-serif text-lg text-gold mb-3 text-center">📜 游戏复盘</h2>
      <div className="space-y-3">
        {roundHistory.map((rh) => {
          const teamSize = TEAM_SIZES[playerCount]?.[rh.round - 1] ?? 0;
          const isProtected = failsRequired(playerCount, rh.round) >= 2;

          return (
            <div key={rh.round} className="bg-nightLight rounded-xl overflow-hidden border border-slate-700">
              {/* Round header */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50">
                <span className="text-sm font-semibold text-white">第{rh.round}轮</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">{teamSize}人任务</span>
                  {isProtected && <span className="text-[10px] text-gold">🛡 保护轮</span>}
                </div>
              </div>

              {/* Proposals */}
              <div className="px-3 py-2 space-y-2">
                {rh.proposals.map((proposal, idx) => {
                  const leader = getPlayer(proposal.leader);
                  const isRejected = !proposal.vote.approved;

                  return (
                    <div key={idx} className={`rounded-lg p-2 ${isRejected ? 'bg-evil/5' : 'bg-good/5'}`}>
                      {/* Leader */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs text-slate-500">队长</span>
                        <AvatarImage avatarId={leader?.avatar ?? 0} size="xs" />
                        <span className="text-xs text-white font-medium">{leader?.name ?? '?'}</span>
                      </div>

                      {/* Team */}
                      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                        <span className="text-xs text-slate-500 mr-0.5">队伍</span>
                        {proposal.team.map(pid => {
                          const p = getPlayer(pid);
                          const alignment = getAlignment(pid);
                          return (
                            <div key={pid} className="flex items-center gap-0.5">
                              <AvatarImage avatarId={p?.avatar ?? 0} size="xs" />
                              <span className={`text-[11px] font-medium ${
                                alignment === 'good' ? 'text-good-light' :
                                alignment === 'evil' ? 'text-evil-light' : 'text-slate-300'
                              }`}>{p?.name ?? '?'}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Vote result */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isRejected ? 'text-evil' : 'text-good'}`}>
                          {isRejected ? '✗ 拒绝' : '✓ 通过'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {proposal.vote.approveCount} 同意 / {proposal.vote.rejectCount} 拒绝
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Quest result */}
                {rh.questResult && (
                  <div className={`rounded-lg p-2 border ${
                    rh.questResult.success ? 'border-good/30 bg-good/10' : 'border-evil/30 bg-evil/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${
                        rh.questResult.success ? 'text-good-light' : 'text-evil-light'
                      }`}>
                        {rh.questResult.success ? '✓ 任务成功' : '✗ 任务失败'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {rh.questResult.successCount} 成功 / {rh.questResult.failCount} 失败
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
