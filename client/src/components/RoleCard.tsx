import type { Role, Alignment } from '@shared/types';
import { ROLE_INFO } from '@shared/constants';

interface RoleCardProps {
  role: Role;
  alignment: Alignment;
  flipped: boolean;
  onFlip: () => void;
}

export default function RoleCard({ role, alignment, flipped, onFlip }: RoleCardProps) {
  const info = ROLE_INFO[role];

  return (
    <div
      className={`flip-card w-56 h-72 cursor-pointer ${flipped ? 'flipped' : ''}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner relative w-full h-full">
        {/* Front - card back design */}
        <div className="flip-card-front absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl border-2 border-gold/50 flex flex-col items-center justify-center shadow-xl">
          <div className="text-6xl mb-4">&#9876;</div>
          <div className="font-serif text-gold text-lg">阿瓦隆</div>
          <div className="text-slate-400 text-xs mt-2">点击翻开</div>
        </div>

        {/* Back - role info */}
        <div className={`flip-card-back absolute inset-0 rounded-xl border-2 shadow-xl flex flex-col items-center justify-center px-4 ${
          alignment === 'good'
            ? 'bg-gradient-to-b from-good/20 to-night border-good/50'
            : 'bg-gradient-to-b from-evil/20 to-night border-evil/50'
        }`}>
          <div className="text-4xl mb-3">
            {alignment === 'good' ? '⚜' : '☠'}
          </div>
          <h2 className={`font-serif text-2xl font-bold mb-1 ${
            alignment === 'good' ? 'text-good-light' : 'text-evil-light'
          }`}>
            {info?.name || role}
          </h2>
          <p className={`text-xs mb-3 ${
            alignment === 'good' ? 'text-good' : 'text-evil'
          }`}>
            {alignment === 'good' ? '善良方' : '邪恶方'}
          </p>
          <p className="text-slate-300 text-xs text-center leading-relaxed">
            {info?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
