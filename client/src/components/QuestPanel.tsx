import { useGameStore } from '../stores/gameStore';

export default function QuestPanel() {
  const { view, hasDecidedQuest, submitQuestDecision } = useGameStore();

  if (!view) return null;

  const isEvil = view.myAlignment === 'evil';

  return (
    <div className="fade-in">
      <div className="card mb-4 text-center">
        <p className="text-gold font-serif text-lg mb-2">执行任务</p>
        <p className="text-slate-400 text-sm">
          任务队员：{view.proposedTeam.map(id => {
            const p = view.players.find(pl => pl.id === id);
            return p?.name;
          }).filter(Boolean).join('、')}
        </p>
      </div>

      {!view.isOnTeam ? (
        <div className="text-center text-slate-400">
          你不在本次任务中，等待任务结果...
        </div>
      ) : hasDecidedQuest ? (
        <div className="text-center">
          <div className="text-slate-400">等待其他队员做出决定...</div>
        </div>
      ) : isEvil ? (
        /* Evil players see both options */
        <div className="grid grid-cols-2 gap-4">
          <button
            className="btn-primary text-lg py-4"
            onClick={() => submitQuestDecision(true)}
          >
            &#10003; 成功
          </button>
          <button
            className="btn-danger text-lg py-4"
            onClick={() => submitQuestDecision(false)}
          >
            &#10007; 失败
          </button>
        </div>
      ) : (
        /* Good players only see success (enforced server-side too) */
        <div>
          <button
            className="btn-gold w-full text-lg py-4"
            onClick={() => submitQuestDecision(true)}
          >
            &#10003; 成功
          </button>
          <p className="text-slate-500 text-xs text-center mt-2">
            善良方只能选择成功
          </p>
        </div>
      )}
    </div>
  );
}
