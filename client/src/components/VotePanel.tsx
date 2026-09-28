import { useGameStore } from '../stores/gameStore';

export default function VotePanel() {
  const { view, hasVoted, submitVote } = useGameStore();

  if (!view) return null;

  return (
    <div className="fade-in">
      {/* Proposed team info */}
      <div className="card mb-4">
        <p className="text-slate-400 text-xs mb-2">提议的队伍：</p>
        <div className="flex flex-wrap gap-2">
          {view.proposedTeam.map((id) => {
            const player = view.players.find(p => p.id === id);
            return (
              <span key={id} className="bg-good/10 text-good-light px-3 py-1 rounded-full text-sm">
                {player?.name}
              </span>
            );
          })}
        </div>
      </div>

      {hasVoted ? (
        <div className="text-center">
          <div className="text-slate-400 mb-2">
            等待其他玩家投票...
          </div>
          <div className="text-good text-sm">
            {view.votesSubmitted} / {view.totalPlayers} 已投票
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button
            className="btn-primary text-lg py-4"
            onClick={() => submitVote(true)}
          >
            &#10003; 同意
          </button>
          <button
            className="btn-danger text-lg py-4"
            onClick={() => submitVote(false)}
          >
            &#10007; 拒绝
          </button>
        </div>
      )}
    </div>
  );
}
