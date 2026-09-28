import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import RoleCard from '../components/RoleCard';

export default function RoleRevealScreen() {
  const { view, playerId, ready } = useGameStore();
  const [flipped, setFlipped] = useState(false);

  if (!view) return null;

  const isReady = !view.canAct;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 fade-in">
      <h1 className="font-serif text-2xl text-gold mb-2">查看你的身份</h1>
      <p className="text-slate-400 mb-6 text-sm">
        点击卡牌翻开，记住你的身份后点击"准备"
      </p>

      {/* Role Card */}
      <div className="mb-6">
        <RoleCard
          role={view.myRole!}
          alignment={view.myAlignment!}
          flipped={flipped}
          onFlip={() => setFlipped(!flipped)}
        />
      </div>

      {/* Known players */}
      {flipped && Object.keys(view.knownPlayers).length > 0 && (
        <div className="card w-full max-w-sm mb-6 fade-in">
          <h3 className="text-gold text-sm font-semibold mb-2">你知道的信息：</h3>
          <div className="space-y-1">
            {Object.entries(view.knownPlayers).map(([id, label]) => {
              const player = view.players.find(p => p.id === id);
              return (
                <div key={id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{player?.name}</span>
                  <span className={label.includes('邪恶') ? 'text-evil-light' : 'text-good-light'}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ready status */}
      <div className="text-slate-400 text-sm mb-4">
        {view.readyCount} / {view.totalPlayers} 已准备
      </div>

      {/* Ready button */}
      {isReady ? (
        <div className="text-good text-center">
          <span className="text-lg">&#10003;</span> 已准备，等待其他玩家...
        </div>
      ) : (
        <button
          className="btn-gold w-full max-w-sm text-lg"
          onClick={ready}
          disabled={!flipped}
        >
          {flipped ? '我准备好了' : '先翻开卡牌'}
        </button>
      )}
    </div>
  );
}
