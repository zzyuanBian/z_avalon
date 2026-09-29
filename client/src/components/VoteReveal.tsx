import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function VoteReveal() {
  const { view } = useGameStore();
  const [countdown, setCountdown] = useState(5);

  if (!view || !view.voteResult) return null;

  const { approveCount, rejectCount, approved } = view.voteResult;

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fade-in text-center py-4">
      <h2 className="font-serif text-xl text-gold mb-4">投票结果</h2>

      {/* Anonymous vote tally */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-good text-5xl font-bold burst-in">{approveCount}</div>
          <div className="text-slate-400 text-sm mt-1">同意</div>
        </div>
        <div className="text-slate-600 text-2xl">:</div>
        <div className="text-center">
          <div className="text-evil text-5xl font-bold burst-in">{rejectCount}</div>
          <div className="text-slate-400 text-sm mt-1">拒绝</div>
        </div>
      </div>

      <p className={`text-lg font-semibold mb-4 ${approved ? 'text-good-light' : 'text-evil-light'}`}>
        {approved ? '✓ 队伍通过！' : '✗ 队伍被拒绝！'}
      </p>

      {/* Vote history */}
      {view.voteHistory.length > 1 && (
        <div className="mt-4">
          <p className="text-slate-500 text-xs mb-2">历史投票</p>
          <div className="flex justify-center gap-2">
            {view.voteHistory.map((v, i) => (
              <div
                key={i}
                className={`text-xs px-2 py-1 rounded ${
                  v.approved ? 'bg-good/20 text-good' : 'bg-evil/20 text-evil'
                }`}
              >
                第{i + 1}次 {v.approveCount}:{v.rejectCount}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countdown */}
      <p className="text-slate-500 text-xs mt-4">
        {countdown > 0 ? `${countdown} 秒后继续...` : '即将继续...'}
      </p>
    </div>
  );
}
