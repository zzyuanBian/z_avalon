import { useGameStore } from '../stores/gameStore';

export default function QuestResult() {
  const { view } = useGameStore();

  if (!view || !view.questResult) return null;

  const { success, failCount } = view.questResult;

  return (
    <div className="fade-in text-center py-8">
      <div className={`text-7xl mb-4 burst-in ${success ? '' : ''}`}>
        {success ? '✨' : '💥'}
      </div>
      <h2 className={`font-serif text-3xl font-bold mb-2 ${
        success ? 'text-good-light' : 'text-evil-light'
      }`}>
        {success ? '任务成功！' : '任务失败！'}
      </h2>
      <p className="text-slate-400">
        {failCount} 张失败牌
        {failCount >= 2 && ' (2张失败才能成功)'}
      </p>

      {/* Score summary */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="text-center">
          <div className="text-good text-2xl font-bold">
            {view.missionResults.filter(r => r.success).length}
          </div>
          <div className="text-slate-400 text-xs">成功</div>
        </div>
        <div className="text-slate-600">/</div>
        <div className="text-center">
          <div className="text-evil text-2xl font-bold">
            {view.missionResults.filter(r => !r.success).length}
          </div>
          <div className="text-slate-400 text-xs">失败</div>
        </div>
      </div>
    </div>
  );
}
