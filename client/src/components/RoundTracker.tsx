import type { MissionResult } from '@shared/types';

interface RoundTrackerProps {
  results: MissionResult[];
  currentRound: number;
}

export default function RoundTracker({ results, currentRound }: RoundTrackerProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((round) => {
        const result = results.find(r => r.round === round);
        const isCurrent = round === currentRound && !result;

        let bgColor = 'bg-slate-700'; // pending
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
          icon = `${round}`;
        } else {
          icon = `${round}`;
        }

        return (
          <div
            key={round}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${bgColor} ${
              result ? 'text-white' : isCurrent ? 'text-night' : 'text-slate-400'
            }`}
            title={`第${round}轮`}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
}
