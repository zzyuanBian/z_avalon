import { useState } from 'react';
import type { Player, KnownPlayers } from '@shared/types';
import { useGameStore } from '../stores/gameStore';
import PlayerMarking from './PlayerMarking';
import { AvatarImage } from './Avatars';

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

// Known info badge styles (server-provided, non-editable)
const KNOWN_INFO_STYLES: Record<string, string> = {
  '邪恶': 'bg-red-500/25 text-red-300 border border-red-500/40',
  '梅林?': 'bg-purple-500/25 text-purple-300 border border-purple-500/40',
  '邪恶队友': 'bg-red-500/25 text-red-300 border border-red-500/40',
};

interface PlayerListProps {
  players: Player[];
  leaderIndex: number;
  proposedTeam: string[];
  knownPlayers: KnownPlayers;
  totalPlayers: number;
  onKick?: (playerId: string) => void;
}

export default function PlayerList({ players, leaderIndex, proposedTeam, knownPlayers, totalPlayers, onKick }: PlayerListProps) {
  const { playerId, playerMarks, view, throwProp } = useGameStore();
  const [markingTarget, setMarkingTarget] = useState<{ id: string; name: string } | null>(null);
  const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  const isGameActive = view?.phase !== 'game_over' && view?.phase !== 'lobby';
  const canThrowProps = isGameActive && view && (view.propsRemaining.flower > 0 || view.propsRemaining.egg > 0);

  return (
    <div className="max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((player) => {
          const isLeader = player.seatIndex === leaderIndex;
          const isOnTeam = proposedTeam.includes(player.id);
          const disconnected = !player.connected;
          const marks = playerMarks[player.id] || [];
          const isMe = player.id === playerId;
          const knownLabel = knownPlayers[player.id]; // Server-provided info

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
                {/* Seat avatar */}
                <div className="relative flex-shrink-0">
                  <AvatarImage avatarId={player.avatar ?? 0} size="sm" />
                  {isLeader && (
                    <span className="absolute -top-0.5 -left-0.5 text-[10px]">♕</span>
                  )}
                </div>

                {/* Name + known info + marks */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm truncate ${
                      isLeader ? 'text-gold font-semibold' :
                      isOnTeam ? 'text-good-light' :
                      'text-slate-300'
                    }`}>
                      {player.name}{isMe ? ' (我)' : ''}
                    </span>
                    {/* Server-provided known info badge (non-editable) */}
                    {knownLabel && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                        KNOWN_INFO_STYLES[knownLabel] || 'bg-slate-700 text-slate-300'
                      }`}>
                        {knownLabel}
                      </span>
                    )}
                  </div>
                  {/* Manual marks */}
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

                {/* Kick button (host only, lobby only) */}
                {onKick && !isMe && (
                  <button
                    className="text-slate-500 hover:text-evil text-xs ml-auto flex-shrink-0 px-1"
                    onClick={(e) => { e.stopPropagation(); onKick(player.id); }}
                    title="踢出房间"
                  >✕</button>
                )}

                {/* Prop buttons */}
                {!isMe && canThrowProps && !disconnected && (
                  <div className="flex gap-0.5 ml-auto flex-shrink-0">
                    {view!.propsRemaining.flower > 0 && (
                      <button
                        className="text-sm hover:scale-125 transition-transform active:scale-90 p-0.5"
                        onClick={(e) => { e.stopPropagation(); throwProp(player.id, 'flower'); }}
                        title={`送花 (${view!.propsRemaining.flower})`}
                      >🌸</button>
                    )}
                    {view!.propsRemaining.egg > 0 && (
                      <button
                        className="text-sm hover:scale-125 transition-transform active:scale-90 p-0.5"
                        onClick={(e) => { e.stopPropagation(); throwProp(player.id, 'egg'); }}
                        title={`扔鸡蛋 (${view!.propsRemaining.egg})`}
                      >🥚</button>
                    )}
                  </div>
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
          totalPlayers={totalPlayers}
          onClose={() => setMarkingTarget(null)}
        />
      )}
    </div>
  );
}
