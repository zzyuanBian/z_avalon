import type { MissionResult } from '@shared/types';
import { TEAM_SIZES, failsRequired } from '@shared/constants';

interface RoundTrackerProps {
  results: MissionResult[];
  currentRound: number;
  playerCount: number;
}

export default function RoundTracker({ results, currentRound, playerCount }: RoundTrackerProps) {
  const sizes = TEAM_SIZES[playerCount] || [];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((round) => {
        const result = results.find(r => r.round === round);
        const isCurrent = round === currentRound && !result;
        const teamSize = sizes[round - 1] || 0;
        const isProtected = failsRequired(playerCount, round) >= 2;

        let bgColor = 'bg-slate-700';
        let icon = '';

        if (result) {
          if (result.success) {
            bgColor = 'bg-good';
            icon = '✓';
          } else {
            bgColor = 'bg-evil';
            icon = '✗';
          }
        } else if (isCurrent) {
          bgColor = 'bg-gold ring-2 ring-gold/50';
          icon = `${teamSize}`;
        } else {
          icon = `${teamSize}`;
        }

        const title = `第${round}轮: ${teamSize}人${isProtected ? ' (保护轮)' : ''}`;

        return (
          <div
            key={round}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${bgColor} ${
              result ? 'text-white' : isCurrent ? 'text-night' : 'text-slate-400'
            }`}
            title={title}
          >
            {icon}
            {isProtected && !result && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-gold">🛡</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
