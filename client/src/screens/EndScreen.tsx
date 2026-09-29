import { useGameStore } from '../stores/gameStore';
import { ROLE_INFO } from '@shared/constants';

export default function EndScreen() {
  const { view, playerId, playAgain, leaveRoom } = useGameStore();

  if (!view) return null;

  const goodWins = view.missionResults.filter(r => r.success).length;
  const evilWins = view.missionResults.filter(r => !r.success).length;
  const isGoodWin = view.winner === 'good';
  const myAlignment = view.myAlignment;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 fade-in">
      {/* Winner banner */}
      <div className={`w-full max-w-sm rounded-xl p-6 text-center mb-6 burst-in ${
        isGoodWin
          ? 'bg-gradient-to-b from-good/30 to-good/10 border-2 border-good'
          : 'bg-gradient-to-b from-evil/30 to-evil/10 border-2 border-evil'
      }`}>
        <div className="text-5xl mb-3">
          {isGoodWin ? '⚜' : '☠'}
        </div>
        <h1 className={`font-serif text-3xl font-bold mb-2 ${
          isGoodWin ? 'text-good-light' : 'text-evil-light'
        }`}>
          {isGoodWin ? '善良方胜利！' : '邪恶方胜利！'}
        </h1>
        <p className="text-slate-300 text-sm">
          {view.winReason}
        </p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-good font-bold text-2xl">{goodWins}</div>
          <div className="text-slate-400 text-xs">成功</div>
        </div>
        <div className="text-slate-600">:</div>
        <div className="text-center">
          <div className="text-evil font-bold text-2xl">{evilWins}</div>
          <div className="text-slate-400 text-xs">失败</div>
        </div>
      </div>

      {/* Role reveal table */}
      <div className="w-full max-w-sm mb-6">
        <h2 className="font-serif text-lg text-gold mb-3 text-center">身份公开</h2>
        <div className="space-y-2">
          {view.allRoles?.map((role) => {
            const player = view.players.find(p => p.id === role.playerId);
            const info = ROLE_INFO[role.role];
            const isMe = role.playerId === playerId;
            return (
              <div
                key={role.playerId}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  isMe ? 'bg-slate-700/50 ring-1 ring-gold/50' : 'bg-nightLight'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    role.alignment === 'good' ? 'bg-good/20 text-good-light' : 'bg-evil/20 text-evil-light'
                  }`}>
                    {player?.name?.[0] || '?'}
                  </div>
                  <span className={`text-sm ${isMe ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {player?.name}
                    {isMe && <span className="text-gold text-xs ml-1">(我)</span>}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  role.alignment === 'good' ? 'text-good-light' : 'text-evil-light'
                }`}>
                  {info?.name || role.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3 mt-auto">
        {view.hostId === playerId ? (
          <button className="btn-gold w-full text-lg" onClick={playAgain}>
            再来一局
          </button>
        ) : (
          <div className="text-center text-slate-400 text-sm py-2">
            等待房主发起新一局...
          </div>
        )}
        <button
          className="text-slate-500 hover:text-evil-light w-full py-2 text-sm"
          onClick={leaveRoom}
        >
          离开房间
        </button>
      </div>
    </div>
  );
}
