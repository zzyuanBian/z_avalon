import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function QuestResult() {
  const { view } = useGameStore();
  const [countdown, setCountdown] = useState(5);

  if (!view || !view.questResult) return null;

  const { success, failCount, successCount, teamSize } = view.questResult;

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fade-in text-center py-6">
      <div className={`text-7xl mb-4 burst-in ${success ? '' : ''}`}>
        {success ? '✨' : '💥'}
      </div>
      <h2 className={`font-serif text-3xl font-bold mb-2 ${
        success ? 'text-good-light' : 'text-evil-light'
      }`}>
        {success ? '任务成功！' : '任务失败！'}
      </h2>

      {/* Anonymous quest vote tally */}
      <div className="flex items-center justify-center gap-8 my-6">
        <div className="text-center">
          <div className="text-good text-4xl font-bold">{successCount}</div>
          <div className="text-slate-400 text-xs mt-1">成功</div>
        </div>
        <div className="text-slate-600 text-xl">:</div>
        <div className="text-center">
          <div className="text-evil text-4xl font-bold">{failCount}</div>
          <div className="text-slate-400 text-xs mt-1">失败</div>
        </div>
      </div>

      {failCount >= 2 && (
        <p className="text-slate-400 text-sm mb-2">需要 2 张失败牌才能成功</p>
      )}

      {/* Score summary */}
      <div className="flex items-center justify-center gap-8 mt-4">
        <div className="text-center">
          <div className="text-good text-2xl font-bold">
            {view.missionResults.filter(r => r.success).length}
          </div>
          <div className="text-slate-400 text-xs">成功</div>
        </div>
        <div className="text-slate-600">/</div>
        <div className="text-center">
          <div className="text-evil text-2xl font-bold">
            {view.missionResults.filter(r => !r.success).length}
          </div>
          <div className="text-slate-400 text-xs">失败</div>
        </div>
      </div>

      {/* Countdown */}
      <p className="text-slate-500 text-xs mt-6">
        {countdown > 0 ? `${countdown} 秒后继续...` : '即将继续...'}
      </p>
    </div>
  );
}
