import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function AssassinPanel() {
  const { view, playerId, assassinate } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!view) return null;

  const isAssassin = view.canAct;

  if (!isAssassin) {
    return (
      <div className="fade-in text-center">
        <h2 className="font-serif text-2xl text-evil-light mb-4">⚔ 刺杀阶段</h2>
        <p className="text-slate-400">
          善良方获得3次任务成功！<br />
          刺客正在选择刺杀目标...
        </p>
      </div>
    );
  }

  // Assassin can target anyone except self and known evil teammates
  const targets = view.players.filter(p => {
    if (p.id === playerId) return false;
    if (view.knownPlayers[p.id] === '邪恶队友') return false;
    return true;
  });

  return (
    <div className="fade-in">
      <h2 className="font-serif text-2xl text-evil-light mb-2 text-center">⚔ 刺杀阶段</h2>
      <p className="text-slate-400 text-sm mb-4 text-center">
        选择你认为的梅林进行刺杀！
      </p>

      <div className="space-y-2 mb-4">
        {targets.map((player) => {
          const isSelected = selectedTarget === player.id;
          return (
            <button
              key={player.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] ${
                isSelected
                  ? 'bg-evil/20 ring-2 ring-evil border-evil'
                  : 'bg-nightLight hover:bg-slate-700 border border-slate-600'
              }`}
              onClick={() => { setSelectedTarget(player.id); setConfirmed(false); }}
              disabled={confirmed}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isSelected ? 'bg-evil text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {isSelected ? '⚔' : player.seatIndex + 1}
              </div>
              <span className={`text-sm ${isSelected ? 'text-evil-light font-semibold' : 'text-slate-300'}`}>
                {player.name}
              </span>
            </button>
          );
        })}
      </div>

      {selectedTarget && !confirmed && (
        <button
          className="btn-danger w-full"
          onClick={() => {
            setConfirmed(true);
            assassinate(selectedTarget);
          }}
        >
          确认刺杀
        </button>
      )}

      {confirmed && (
        <div className="text-center text-slate-400">
          刺杀已确认，等待结果...
        </div>
      )}
    </div>
  );
}
