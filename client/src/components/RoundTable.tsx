import { useState } from 'react';
import type { Player, KnownPlayers } from '@shared/types';
import { useGameStore } from '../stores/gameStore';
import PlayerMarking from './PlayerMarking';

const MARK_LABELS: Record<string, string> = {
  merlin: '梅林', percival: '派西维尔', loyal_servant: '忠臣',
  morgana: '莫甘娜', assassin: '刺客', minion_of_mordred: '爪牙', oberon: '奥伯伦',
  good: '好人', evil: '坏人',
};

const KNOWN_DOT_COLORS: Record<string, string> = {
  '邪恶': 'bg-red-400',
  '梅林?': 'bg-purple-400',
  '邪恶队友': 'bg-red-400',
};

interface RoundTableProps {
  players: Player[];
  leaderIndex: number;
  proposedTeam: string[];
  knownPlayers: KnownPlayers;
  totalPlayers: number;
}

const PHASE_ICONS: Record<string, string> = {
  team_selection: '⚔',
  voting: '🗳',
  vote_reveal: '📜',
  quest: '🏰',
  quest_result: '📊',
  assassination: '🗡',
};

export default function RoundTable({ players, leaderIndex, proposedTeam, knownPlayers, totalPlayers }: RoundTableProps) {
  const { playerId, playerMarks, view, throwProp } = useGameStore();
  const [markingTarget, setMarkingTarget] = useState<{ id: string; name: string } | null>(null);

  const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  const myIndex = sorted.findIndex(p => p.id === playerId);
  const n = sorted.length;
  const canThrowProps = view && view.phase !== 'game_over' && view.phase !== 'lobby'
    && (view.propsRemaining.flower > 0 || view.propsRemaining.egg > 0);

  // Calculate position for each player around the circle
  // Current player (myIndex) is at the bottom (270° in CSS coords where 0°=top, clockwise)
  const getPosition = (index: number) => {
    const relIndex = ((index - myIndex) + n) % n;
    const angleDeg = (relIndex * 360) / n;
    const angleRad = (angleDeg * Math.PI) / 180;
    // radius as percentage of container (leaving room for card overflow)
    const r = 40;
    const x = 50 + r * Math.sin(angleRad);
    const y = 50 - r * Math.cos(angleDeg === 180 ? Math.PI : angleRad);
    return { x, y: 50 - r * Math.cos(angleRad) };
  };

  // Voters/deciders status
  const votersSubmitted = view?.votersSubmitted || [];
  const questDecidersSubmitted = view?.questDecidersSubmitted || [];

  return (
    <div className="w-full flex flex-col items-center py-2">
      {/* Round table container */}
      <div
        className="relative w-full max-w-[340px] aspect-square"
        style={{ minWidth: '280px' }}
      >
        {/* The table itself */}
        <div className="table-glow absolute inset-[15%] rounded-full bg-gradient-to-b from-slate-800 to-slate-900 border-[3px] border-gold/30 flex flex-col items-center justify-center">
          {/* Center info */}
          <div className="text-center">
            <div className="text-gold font-serif text-2xl font-bold">
              {view?.currentRound || 1}
            </div>
            <div className="text-slate-400 text-[10px] mt-0.5">
              第{view?.currentRound || 1}轮
            </div>
            {view?.phase && PHASE_ICONS[view.phase] && (
              <div className="text-lg mt-1">{PHASE_ICONS[view.phase]}</div>
            )}
            {/* Proposed team avatars */}
            {proposedTeam.length > 0 && (
              <div className="flex gap-0.5 mt-1.5 justify-center">
                {proposedTeam.map(id => {
                  const p = players.find(pl => pl.id === id);
                  return (
                    <div
                      key={id}
                      className="w-5 h-5 rounded-full bg-good/30 text-good-light text-[9px] flex items-center justify-center font-bold border border-good/50"
                    >
                      {p?.name?.[0] || '?'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Player seats around the table */}
        {sorted.map((player, index) => {
          const pos = getPosition(index);
          const isLeader = player.seatIndex === leaderIndex;
          const isOnTeam = proposedTeam.includes(player.id);
          const isMe = player.id === playerId;
          const disconnected = !player.connected;
          const marks = playerMarks[player.id] || [];
          const knownLabel = knownPlayers[player.id];
          const knownDotColor = knownLabel ? KNOWN_DOT_COLORS[knownLabel] : null;

          // Vote/quest status
          let statusDot = '';
          if (view?.phase === 'voting') {
            statusDot = votersSubmitted.includes(player.id) ? '✓' : '';
          } else if (view?.phase === 'quest' && proposedTeam.includes(player.id)) {
            statusDot = questDecidersSubmitted.includes(player.id) ? '✓' : '';
          }

          return (
            <div
              key={player.id}
              className="seat-group absolute flex flex-col items-center"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isMe ? 10 : 5,
              }}
            >
              {/* Player avatar */}
              <div
                onClick={() => {
                  if (!isMe && view?.phase !== 'game_over' && view?.phase !== 'lobby') {
                    setMarkingTarget({ id: player.id, name: player.name });
                  }
                }}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  disconnected ? 'opacity-40' : 'cursor-pointer'
                } ${
                  isLeader ? 'bg-gold/20 text-gold ring-2 ring-gold/60' :
                  isOnTeam ? 'bg-good/20 text-good-light ring-2 ring-good/50' :
                  isMe ? 'bg-slate-700 text-white ring-2 ring-slate-500' :
                  'bg-slate-700/80 text-slate-300 hover:ring-1 hover:ring-slate-500'
                }`}
              >
                {isLeader ? '♕' : player.name?.[0] || '?'}

                {/* Known info dot */}
                {knownDotColor && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${knownDotColor} border border-night`} />
                )}

                {/* Status indicator */}
                {statusDot && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-good text-white text-[8px] flex items-center justify-center font-bold border border-night">
                    ✓
                  </span>
                )}

                {/* Disconnected */}
                {disconnected && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-evil text-white text-[7px] flex items-center justify-center border border-night">
                    ✕
                  </span>
                )}
              </div>

              {/* Name */}
              <span className={`text-[10px] mt-0.5 max-w-[48px] truncate text-center leading-tight ${
                isLeader ? 'text-gold font-semibold' :
                isOnTeam ? 'text-good-light' :
                isMe ? 'text-white font-semibold' :
                'text-slate-400'
              }`}>
                {player.name}{isMe ? '(我)' : ''}
              </span>

              {/* Marks as tiny dots */}
              {marks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {marks.slice(0, 3).map(mark => {
                    const isEvil = ['evil', 'morgana', 'assassin', 'minion_of_mordred', 'oberon'].includes(mark);
                    return (
                      <span
                        key={mark}
                        className={`w-1.5 h-1.5 rounded-full ${isEvil ? 'bg-evil-light' : 'bg-good-light'}`}
                        title={MARK_LABELS[mark] || mark}
                      />
                    );
                  })}
                </div>
              )}

              {/* Prop buttons (visible on hover for non-self players) */}
              {!isMe && canThrowProps && !disconnected && (
                <div className="seat-props absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 transition-opacity">
                  {view!.propsRemaining.flower > 0 && (
                    <button
                      className="text-xs hover:scale-125 active:scale-90 p-0.5"
                      onClick={(e) => { e.stopPropagation(); throwProp(player.id, 'flower'); }}
                      title={`送花 (${view!.propsRemaining.flower})`}
                    >🌸</button>
                  )}
                  {view!.propsRemaining.egg > 0 && (
                    <button
                      className="text-xs hover:scale-125 active:scale-90 p-0.5"
                      onClick={(e) => { e.stopPropagation(); throwProp(player.id, 'egg'); }}
                      title={`扔鸡蛋 (${view!.propsRemaining.egg})`}
                    >🥚</button>
                  )}
                </div>
              )}
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
