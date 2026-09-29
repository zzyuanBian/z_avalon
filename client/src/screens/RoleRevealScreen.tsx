import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import RoleCard from '../components/RoleCard';
import { ROLE_INFO } from '@shared/constants';

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

      {/* Role config */}
      {flipped && (
        <div className="card w-full max-w-sm mb-6 fade-in">
          <h3 className="text-gold text-sm font-semibold mb-2">本局角色配置：</h3>
          <div className="flex flex-wrap gap-1.5">
            {view.roleConfig.good.map((role, i) => (
              <span key={`g${i}`} className="text-xs px-2 py-0.5 rounded bg-good/20 text-good-light">
                {ROLE_INFO[role]?.name || role}
              </span>
            ))}
            {view.roleConfig.evil.map((role, i) => (
              <span key={`e${i}`} className="text-xs px-2 py-0.5 rounded bg-evil/20 text-evil-light">
                {ROLE_INFO[role]?.name || role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ready status */}
      <div className="w-full max-w-sm mb-4">
        <div className="text-slate-400 text-sm text-center mb-2">
          {view.readyCount} / {view.totalPlayers} 已准备
        </div>
        <div className="space-y-1">
          {[...view.players].sort((a, b) => a.seatIndex - b.seatIndex).map(player => {
            const isReady = view.readyPlayers.includes(player.id);
            const isMe = player.id === playerId;
            return (
              <div key={player.id} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                isMe ? 'bg-slate-700/50' : 'bg-nightLight'
              }`}>
                <span className={`${isMe ? 'text-white font-medium' : 'text-slate-300'}`}>
                  {player.name}{isMe && <span className="text-gold text-xs ml-1">(我)</span>}
                </span>
                <span className={`text-xs font-medium ${isReady ? 'text-good' : 'text-slate-500'}`}>
                  {isReady ? '✓ 已准备' : '未准备'}
                </span>
              </div>
            );
          })}
        </div>
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
