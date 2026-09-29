import { useGameStore } from '../stores/gameStore';
import { ROLE_INFO } from '@shared/constants';

export default function InfoPanel() {
  const { view } = useGameStore();

  if (!view || !view.myRole) return null;

  const roleInfo = ROLE_INFO[view.myRole];
  const knownEntries = Object.entries(view.knownPlayers);
  // Resolve known player IDs to names
  const knownNames = knownEntries.map(([id, alignment]) => {
    const player = view.players.find(p => p.id === id);
    return { name: player?.name || '?', alignment };
  });

  return (
    <div className="px-4 py-2">
      <div className="max-w-lg mx-auto">
        <div className={`px-3 py-2 rounded-lg ${
          view.myAlignment === 'good' ? 'bg-good/5 border border-good/20' : 'bg-evil/5 border border-evil/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-lg ${view.myAlignment === 'good' ? 'text-good-light' : 'text-evil-light'}`}>
              {view.myAlignment === 'good' ? '⚜' : '☠'}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-semibold ${
                view.myAlignment === 'good' ? 'text-good-light' : 'text-evil-light'
              }`}>
                {roleInfo?.name}
              </span>
              {knownNames.length > 0 && (
                <span className="text-slate-500 text-xs ml-2">
                  | 已知: {knownNames.length} 人
                </span>
              )}
            </div>
            {view.isLeader && (
              <span className="text-gold text-xs">♕ 队长</span>
            )}
          </div>

          {/* Known players list */}
          {knownNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-8">
              {knownNames.map(({ name, alignment }, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    alignment === 'evil'
                      ? 'bg-evil/15 text-evil-light'
                      : 'bg-good/15 text-good-light'
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
