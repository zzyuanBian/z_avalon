import type { Player } from '@shared/types';

interface PlayerListProps {
  players: Player[];
  leaderIndex: number;
  proposedTeam: string[];
}

export default function PlayerList({ players, leaderIndex, proposedTeam }: PlayerListProps) {
  const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);

  return (
    <div className="max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((player, i) => {
          const isLeader = player.seatIndex === leaderIndex;
          const isOnTeam = proposedTeam.includes(player.id);
          const disconnected = !player.connected;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isLeader ? 'bg-gold/10 ring-1 ring-gold/40' :
                isOnTeam ? 'bg-good/10 ring-1 ring-good/30' :
                'bg-nightLight'
              } ${disconnected ? 'opacity-50' : ''}`}
            >
              {/* Seat number */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isLeader ? 'bg-gold/20 text-gold crown-pulse' :
                isOnTeam ? 'bg-good/20 text-good-light' :
                'bg-slate-700 text-slate-400'
              }`}>
                {isLeader ? '♕' : player.seatIndex + 1}
              </div>

              {/* Name */}
              <span className={`text-sm truncate ${
                isLeader ? 'text-gold font-semibold' :
                isOnTeam ? 'text-good-light' :
                'text-slate-300'
              }`}>
                {player.name}
              </span>

              {/* Disconnected indicator */}
              {disconnected && (
                <span className="text-evil text-xs ml-auto">离线</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
