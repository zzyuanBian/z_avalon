import { useState, useRef, useEffect } from 'react';
import type { LogEntry } from '@shared/types';

interface GameLogProps {
  log: LogEntry[];
}

export default function GameLog({ log }: GameLogProps) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length, expanded]);

  if (log.length === 0) return null;

  const lastEntry = log[log.length - 1];

  return (
    <div className="px-4 py-2">
      <div className="max-w-lg mx-auto">
        {/* Toggle */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 bg-nightLight rounded-lg border border-slate-700 text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-slate-300 truncate flex-1 text-left">
            {lastEntry.message}
          </span>
          <span className="text-slate-500 text-xs ml-2">
            {expanded ? '▼' : '▲'} {log.length} 条
          </span>
        </button>

        {/* Expanded log */}
        {expanded && (
          <div
            ref={scrollRef}
            className="mt-1 max-h-40 overflow-y-auto bg-nightLight rounded-lg border border-slate-700 p-2 space-y-1"
          >
            {log.map((entry, i) => (
              <div key={i} className="text-xs text-slate-400 flex gap-2">
                <span className="text-slate-600 shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={
                  entry.type === 'game_over' ? 'text-gold font-semibold' :
                  entry.type === 'quest_result' ? 'text-good-light' :
                  entry.type === 'vote_result' ? 'text-slate-300' :
                  'text-slate-400'
                }>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
