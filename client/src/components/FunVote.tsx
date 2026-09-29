import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { ROLE_INFO } from '@shared/constants';

export default function FunVote() {
  const { view, playerId, submitFunVote } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!view) return null;

  const hasVoted = submitted || !view.canAct;
  const result = view.funVoteResult;
  const sorted = [...view.players]
    .filter(p => p.id !== playerId)
    .sort((a, b) => a.seatIndex - b.seatIndex);

  const handleSubmit = () => {
    if (!selected) return;
    submitFunVote(selected);
    setSubmitted(true);
  };

  const topVoted = result?.[0];
  const topPlayer = topVoted ? view.players.find(p => p.id === topVoted.playerId) : null;
  const getRole = (pid: string) => {
    const r = view.allRoles?.find(ar => ar.playerId === pid);
    return r ? ROLE_INFO[r.role] : null;
  };

  return (
    <div className="w-full max-w-sm mb-6">
      <div className="bg-nightLight rounded-xl border border-gold/30 p-4">
        <h3 className="font-serif text-gold text-center text-lg mb-1">🤡 最愚玩家投票</h3>
        <p className="text-slate-400 text-xs text-center mb-3">
          选出本局最愚的那位选手！
        </p>

        {/* Voting UI */}
        {!hasVoted && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto">
              {sorted.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelected(player.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                    selected === player.id
                      ? 'bg-gold/20 border-gold text-gold font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
            <button
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                selected
                  ? 'btn-gold'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
              disabled={!selected}
              onClick={handleSubmit}
            >
              投票！
            </button>
          </>
        )}

        {/* Waiting for votes */}
        {hasVoted && !result && (
          <div className="text-center text-slate-400 text-sm py-3">
            已投票，等待其他玩家...
            <span className="text-slate-500 ml-1">
              ({view.funVotesSubmitted}/{view.totalPlayers})
            </span>
          </div>
        )}

        {/* Results */}
        {result && topPlayer && (
          <div className="text-center py-2">
            <img
              src="/fool.png"
              alt="最愚玩家"
              className="w-28 h-28 mx-auto mb-2 object-contain drop-shadow-lg"
            />
            <div className="text-gold font-serif text-lg font-bold">
              {topPlayer.name}
              {(() => {
                const role = getRole(topPlayer.id);
                return role ? (
                  <span className={`ml-1.5 text-xs font-normal px-1.5 py-0.5 rounded ${
                    role.alignment === 'good'
                      ? 'bg-good/20 text-good-light'
                      : 'bg-evil/20 text-evil-light'
                  }`}>
                    {role.name}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="text-slate-400 text-sm">
              荣获本局最愚称号！获得 <span className="text-evil-light font-bold">{topVoted!.voteCount}</span> 票
            </div>

            {/* Full ranking */}
            {result.length > 1 && (
              <div className="mt-3 space-y-1">
                {result.slice(0, 5).map((r, i) => {
                  const p = view.players.find(pl => pl.id === r.playerId);
                  const role = getRole(r.playerId);
                  return (
                    <div key={r.playerId} className="flex items-center justify-between text-xs px-2 py-1">
                      <span className={i === 0 ? 'text-gold font-semibold' : 'text-slate-400'}>
                        {i === 0 ? '🤡' : `${i + 1}.`} {p?.name || '?'}
                        {role && (
                          <span className={`ml-1 text-[10px] font-normal px-1 py-0.5 rounded ${
                            role.alignment === 'good'
                              ? 'bg-good/20 text-good-light'
                              : 'bg-evil/20 text-evil-light'
                          }`}>
                            {role.name}
                          </span>
                        )}
                      </span>
                      <span className={i === 0 ? 'text-evil-light font-bold' : 'text-slate-500'}>
                        {r.voteCount} 票
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
