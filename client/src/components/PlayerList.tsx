import { useState } from 'react';
import type { Player } from '@shared/types';
import { useGameStore } from '../stores/gameStore';
import PlayerMarking from './PlayerMarking';

const MARK_LABELS: Record<string, string> = {
  merlin: '梅林',
  percival: '派西维尔',
  loyal_servant: '忠臣',
  morgana: '莫甘娜',
  assassin: '刺客',
  minion_of_mordred: '爪牙',
  oberon: '奥伯伦',
  good: '好人',
  evil: '坏人',
};

interface PlayerListProps {
  players: Player[];
  leaderIndex: number;
  proposedTeam: string[];
}

export default function PlayerList({ players, leaderIndex, proposedTeam }: PlayerListProps) {
  const { playerId, playerMarks, view } = useGameStore();
  const [markingTarget, setMarkingTarget] = useState<{ id: string; name: string } | null>(null);
  const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  const isGameActive = view?.phase !== 'game_over';

  return (
    <div className="max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((player) => {
          const isLeader = player.seatIndex === leaderIndex;
          const isOnTeam = proposedTeam.includes(player.id);
          const disconnected = !player.connected;
          const marks = playerMarks[player.id] || [];
          const isMe = player.id === playerId;

          return (
            <div key={player.id}>
              <div
                onClick={() => {
                  if (!isMe && isGameActive) setMarkingTarget({ id: player.id, name: player.name });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isLeader ? 'bg-gold/10 ring-1 ring-gold/40' :
                  isOnTeam ? 'bg-good/10 ring-1 ring-good/30' :
                  'bg-nightLight'
                } ${disconnected ? 'opacity-50' : ''} ${
                  !isMe && isGameActive ? 'cursor-pointer hover:ring-1 hover:ring-slate-500' : ''
                }`}
              >
                {/* Seat number */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isLeader ? 'bg-gold/20 text-gold crown-pulse' :
                  isOnTeam ? 'bg-good/20 text-good-light' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {isLeader ? '♕' : player.seatIndex + 1}
                </div>

                {/* Name + marks */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm truncate block ${
                    isLeader ? 'text-gold font-semibold' :
                    isOnTeam ? 'text-good-light' :
                    'text-slate-300'
                  }`}>
                    {player.name}{isMe ? ' (我)' : ''}
                  </span>
                  {marks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {marks.map(mark => {
                        const isEvil = ['evil', 'morgana', 'assassin', 'minion_of_mordred', 'oberon'].includes(mark);
                        return (
                          <span
                            key={mark}
                            className={`text-[10px] px-1 rounded ${
                              isEvil ? 'bg-evil/30 text-evil-light' : 'bg-good/30 text-good-light'
                            }`}
                          >
                            {MARK_LABELS[mark] || mark}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Disconnected indicator */}
                {disconnected && (
                  <span className="text-evil text-xs ml-auto flex-shrink-0">离线</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Marking modal */}
      {markingTarget && (
        <PlayerMarking
          playerId={markingTarget.id}
          playerName={markingTarget.name}
          onClose={() => setMarkingTarget(null)}
        />
      )}
    </div>
  );
}
