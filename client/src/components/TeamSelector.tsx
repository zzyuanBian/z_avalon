import { useGameStore } from '../stores/gameStore';

export default function TeamSelector() {
  const { view, selectedTeam, toggleTeamMember, proposeTeam } = useGameStore();

  if (!view) return null;

  const canPropose = selectedTeam.length === view.teamSize;
  const leader = view.players.find(p => p.seatIndex === view.leaderIndex);

  // Non-leaders see a waiting message
  if (!view.isLeader) {
    return (
      <div className="fade-in text-center py-8">
        <div className="text-4xl mb-4">♕</div>
        <p className="text-gold font-serif text-lg">等待队长提名队伍</p>
        <p className="text-slate-400 text-sm mt-2">
          队长 <span className="text-gold">{leader?.name}</span> 正在选人
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-4">
        <p className="text-gold font-serif text-lg">选择 {view.teamSize} 名队员</p>
        <p className="text-slate-400 text-sm">
          已选 {selectedTeam.length} / {view.teamSize}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {view.players.map((player) => {
          const isSelected = selectedTeam.includes(player.id);
          return (
            <button
              key={player.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] ${
                isSelected
                  ? 'bg-good/20 ring-2 ring-good border-good'
                  : 'bg-nightLight hover:bg-slate-700 border border-slate-600'
              }`}
              onClick={() => toggleTeamMember(player.id)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isSelected ? 'bg-good text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {isSelected ? '✓' : player.seatIndex + 1}
              </div>
              <span className={`text-sm ${isSelected ? 'text-good-light font-semibold' : 'text-slate-300'}`}>
                {player.name}
              </span>
              {player.seatIndex === view.leaderIndex && (
                <span className="text-gold text-xs ml-auto">♕ 队长</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        className="btn-primary w-full"
        onClick={proposeTeam}
        disabled={!canPropose}
      >
        {canPropose ? '提名队伍' : `还需选择 ${view.teamSize - selectedTeam.length} 人`}
      </button>
    </div>
  );
}
