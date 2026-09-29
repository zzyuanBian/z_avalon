import { useGameStore } from '../stores/gameStore';

const MARK_OPTIONS = [
  { label: '梅林', value: 'merlin', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { label: '派西维尔', value: 'percival', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { label: '忠臣', value: 'loyal_servant', color: 'bg-blue-400/20 text-blue-200 border-blue-400/40' },
  { label: '莫甘娜', value: 'morgana', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { label: '刺客', value: 'assassin', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { label: '爪牙', value: 'minion_of_mordred', color: 'bg-red-400/20 text-red-200 border-red-400/40' },
  { label: '奥伯伦', value: 'oberon', color: 'bg-red-400/20 text-red-200 border-red-400/40' },
  { label: '好人', value: 'good', color: 'bg-good/20 text-good-light border-good/40' },
  { label: '坏人', value: 'evil', color: 'bg-evil/20 text-evil-light border-evil/40' },
];

interface Props {
  playerId: string;
  playerName: string;
  onClose: () => void;
}

export default function PlayerMarking({ playerId, playerName, onClose }: Props) {
  const { playerMarks, togglePlayerMark } = useGameStore();
  const currentMarks = playerMarks[playerId] || [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-nightLight w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-gold text-lg">标记 {playerName}</h3>
          <button className="text-slate-400 hover:text-white text-xl" onClick={onClose}>✕</button>
        </div>

        {/* Current marks */}
        {currentMarks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {currentMarks.map(mark => {
              const opt = MARK_OPTIONS.find(o => o.value === mark);
              return (
                <span key={mark} className={`text-xs px-2 py-1 rounded-full border ${opt?.color || ''}`}>
                  {opt?.label || mark}
                </span>
              );
            })}
          </div>
        )}

        {/* Mark options */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Alignment marks */}
          <p className="text-slate-500 text-xs mt-1">阵营猜测</p>
          <div className="flex gap-2">
            {MARK_OPTIONS.filter(m => m.value === 'good' || m.value === 'evil').map(opt => {
              const active = currentMarks.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    active ? opt.color + ' ring-2 ring-white/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  onClick={() => togglePlayerMark(playerId, opt.value)}
                >
                  {active ? '✓ ' : ''}{opt.label}
                </button>
              );
            })}
          </div>

          {/* Role marks */}
          <p className="text-slate-500 text-xs mt-2">角色猜测</p>
          <div className="grid grid-cols-3 gap-2">
            {MARK_OPTIONS.filter(m => m.value !== 'good' && m.value !== 'evil').map(opt => {
              const active = currentMarks.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    active ? opt.color + ' ring-2 ring-white/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  onClick={() => togglePlayerMark(playerId, opt.value)}
                >
                  {active ? '✓ ' : ''}{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button className="btn-primary w-full mt-4" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}
