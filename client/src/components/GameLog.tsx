import { useState, useRef, useEffect } from 'react';
import type { LogEntry } from '@shared/types';

interface GameLogProps {
  log: LogEntry[];
  playerNames?: string[];
}

// Parse a log message and return styled JSX elements
function renderLogMessage(entry: LogEntry, playerNames: string[]): React.ReactNode {
  const msg = entry.message;

  // Helper: highlight player names in text
  const highlightNames = (text: string): React.ReactNode[] => {
    if (playerNames.length === 0) return [text];
    const nameRegex = new RegExp(`(${playerNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(nameRegex);
    return parts.map((part, i) => {
      if (playerNames.includes(part)) {
        return <span key={i} className="text-gold font-semibold">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Helper: highlight numbers
  const highlightNumbers = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\d+)/);
    return parts.map((part, i) => {
      if (/^\d+$/.test(part)) {
        return <span key={i} className="text-white font-bold">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  switch (entry.type) {
    case 'round_start': {
      // "第X轮开始！Y 是队长，请提名队伍。" or "队长轮换至 Y，请提名新队伍。"
      const roundMatch = msg.match(/第(\d+)轮/);
      const parts = msg.split(/(第\d+轮|开始|队长|轮换至|提名)/);
      return parts.map((part, i) => {
        if (/^第\d+轮$/.test(part)) return <span key={i} className="text-gold font-bold">{part}</span>;
        if (part === '队长') return <span key={i} className="text-amber-400">{part}</span>;
        if (playerNames.some(n => msg.includes(n))) {
          // Will be handled below
        }
        return <span key={i}>{part}</span>;
      });
    }

    case 'team_proposed': {
      // "X 提名的队伍：A、B"
      const idx = msg.indexOf('提名的队伍：');
      if (idx >= 0) {
        const prefix = msg.slice(0, idx);
        const names = msg.slice(idx + 6);
        return (
          <>
            {highlightNames(prefix)}
            <span className="text-slate-500">提名的队伍：</span>
            <span className="text-good-light font-medium">{highlightNames(names)}</span>
          </>
        );
      }
      return highlightNames(msg);
    }

    case 'vote_result': {
      // "投票结果：X 同意 / Y 拒绝。队伍通过！执行任务中..." or rejected
      const approved = msg.includes('通过');
      return (
        <>
          <span className="text-slate-400">投票结果：</span>
          {msg.match(/(\d+)\s*同意\s*\/\s*(\d+)\s*拒绝/) ? (
            <>
              <span className="text-good-light font-bold">{RegExp.$1}</span>
              <span className="text-slate-500"> 同意 / </span>
              <span className="text-evil-light font-bold">{RegExp.$2}</span>
              <span className="text-slate-500"> 拒绝</span>
            </>
          ) : null}
          {approved ? (
            <span className="text-good-light ml-1">✓ 通过</span>
          ) : (
            <span className="text-evil-light ml-1">✗ 拒绝</span>
          )}
        </>
      );
    }

    case 'quest_result': {
      // "第X轮任务成功/失败！X 成功 / Y 失败。当前：X 成功 / Y 失败"
      const success = msg.includes('成功！');
      const roundMatch = msg.match(/第(\d+)轮/);
      const scoreMatch = msg.match(/(\d+)\s*成功\s*\/\s*(\d+)\s*失败。当前：(\d+)\s*成功\s*\/\s*(\d+)\s*失败/);

      return (
        <>
          {roundMatch && <span className="text-gold font-bold">第{roundMatch[1]}轮</span>}
          <span className={success ? 'text-good-light font-semibold' : 'text-evil-light font-semibold'}>
            {' '}{success ? '任务成功' : '任务失败'}
          </span>
          {scoreMatch && (
            <span className="text-slate-400">
              {' '}
              <span className="text-good-light font-medium">{scoreMatch[1]}</span>
              <span className="text-slate-500"> 成功 / </span>
              <span className="text-evil-light font-medium">{scoreMatch[2]}</span>
              <span className="text-slate-500"> 失败</span>
              <span className="text-slate-600"> | </span>
              <span className="text-good-light">{scoreMatch[3]}✓</span>
              <span className="text-slate-600"> : </span>
              <span className="text-evil-light">{scoreMatch[4]}✗</span>
            </span>
          )}
        </>
      );
    }

    case 'game_over': {
      return <span className="text-gold font-bold">{highlightNames(msg)}</span>;
    }

    default:
      return highlightNames(msg);
  }
}

export default function GameLog({ log, playerNames = [] }: GameLogProps) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        {/* Toggle - shows last entry */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 bg-nightLight rounded-lg border border-slate-700 text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="truncate flex-1 text-left text-slate-300">
            {renderLogMessage(lastEntry, playerNames)}
          </span>
          <span className="text-slate-500 text-xs ml-2 flex-shrink-0">
            {expanded ? '▼' : '▲'} {log.length}
          </span>
        </button>

        {/* Expanded log */}
        {expanded && (
          <div
            ref={scrollRef}
            className="mt-1 max-h-40 overflow-y-auto bg-nightLight rounded-lg border border-slate-700 p-2 space-y-1.5"
          >
            {log.map((entry, i) => (
              <div key={i} className="text-xs flex gap-2 items-start">
                <span className="text-slate-600 shrink-0 font-mono text-[10px] mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={
                  entry.type === 'game_over' ? 'font-semibold' :
                  entry.type === 'quest_result' ? '' :
                  'text-slate-400'
                }>
                  {renderLogMessage(entry, playerNames)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
