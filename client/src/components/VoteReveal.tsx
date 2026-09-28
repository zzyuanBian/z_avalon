import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function VoteReveal() {
  const { view } = useGameStore();
  const [revealCount, setRevealCount] = useState(0);

  if (!view || !view.votes) return null;

  const entries = Object.entries(view.votes);
  const totalVotes = entries.length;
  const approveCount = entries.filter(([, v]) => v).length;
  const rejectCount = totalVotes - approveCount;
  const approved = approveCount > rejectCount;

  // Staggered reveal animation
  useEffect(() => {
    if (revealCount < totalVotes) {
      const timer = setTimeout(() => setRevealCount(c => c + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [revealCount, totalVotes]);

  return (
    <div className="fade-in text-center">
      <h2 className="font-serif text-xl text-gold mb-4">投票结果</h2>

      {/* Vote cards flipping one by one */}
      <div className="grid grid-cols-5 gap-2 mb-6 max-w-xs mx-auto">
        {entries.map(([playerId, vote], i) => {
          const player = view.players.find(p => p.id === playerId);
          const revealed = i < revealCount;
          return (
            <div
              key={playerId}
              className={`text-center ${revealed ? 'vote-flip' : 'opacity-30'}`}
            >
              <div className={`w-10 h-12 rounded-lg flex items-center justify-center text-lg font-bold mx-auto mb-1 ${
                !revealed ? 'bg-slate-700' :
                vote ? 'bg-good text-white' : 'bg-evil text-white'
              }`}>
                {revealed ? (vote ? '✓' : '✗') : '?'}
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                {player?.name?.slice(0, 4)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tally */}
      {revealCount === totalVotes && (
        <div className="fade-in">
          <div className="flex items-center justify-center gap-6 mb-3">
            <div className="text-center">
              <div className="text-good text-3xl font-bold">{approveCount}</div>
              <div className="text-slate-400 text-xs">同意</div>
            </div>
            <div className="text-slate-600 text-xl">:</div>
            <div className="text-center">
              <div className="text-evil text-3xl font-bold">{rejectCount}</div>
              <div className="text-slate-400 text-xs">拒绝</div>
            </div>
          </div>
          <p className={`text-lg font-semibold ${approved ? 'text-good-light' : 'text-evil-light'}`}>
            {approved ? '✓ 队伍通过！' : '✗ 队伍被拒绝！'}
          </p>
        </div>
      )}
    </div>
  );
}
