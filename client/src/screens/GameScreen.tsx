import { useGameStore } from '../stores/gameStore';
import RoundTracker from '../components/RoundTracker';
import VoteTracker from '../components/VoteTracker';
import PlayerList from '../components/PlayerList';
import TeamSelector from '../components/TeamSelector';
import VotePanel from '../components/VotePanel';
import VoteReveal from '../components/VoteReveal';
import QuestPanel from '../components/QuestPanel';
import QuestResult from '../components/QuestResult';
import AssassinPanel from '../components/AssassinPanel';
import InfoPanel from '../components/InfoPanel';
import GameLog from '../components/GameLog';

export default function GameScreen() {
  const { view } = useGameStore();

  if (!view) return null;

  const renderPhaseContent = () => {
    switch (view.phase) {
      case 'team_selection':
        return <TeamSelector />;
      case 'voting':
        return <VotePanel />;
      case 'vote_reveal':
        return <VoteReveal />;
      case 'quest':
        return <QuestPanel />;
      case 'quest_result':
        return <QuestResult />;
      case 'assassination':
        return <AssassinPanel />;
      default:
        return null;
    }
  };

  const getPhaseLabel = () => {
    switch (view.phase) {
      case 'team_selection': return '提名队伍';
      case 'voting': return '投票阶段';
      case 'vote_reveal': return '投票结果';
      case 'quest': return '执行任务';
      case 'quest_result': return '任务结果';
      case 'assassination': return '刺杀阶段';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Header */}
      <div className="bg-nightLight border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <RoundTracker results={view.missionResults} currentRound={view.currentRound} />
          <div className="text-center">
            <div className="text-gold font-serif text-sm">{getPhaseLabel()}</div>
            <div className="text-slate-400 text-xs">房间 {view.roomId}</div>
          </div>
          <VoteTracker count={view.consecutiveRejections} />
        </div>
      </div>

      {/* Player list */}
      <div className="px-4 py-3">
        <PlayerList
          players={view.players}
          leaderIndex={view.leaderIndex}
          proposedTeam={view.proposedTeam}
        />
      </div>

      {/* Phase content */}
      <div className="flex-1 px-4 py-3">
        <div className="max-w-lg mx-auto">
          {renderPhaseContent()}
        </div>
      </div>

      {/* Info panel */}
      <InfoPanel />

      {/* Game log */}
      <GameLog log={view.log} />
    </div>
  );
}
