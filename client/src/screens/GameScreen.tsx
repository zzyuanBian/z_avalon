import { useGameStore } from '../stores/gameStore';
import RoundTracker from '../components/RoundTracker';
import VoteTracker from '../components/VoteTracker';
import RoundTable from '../components/RoundTable';
import TeamSelector from '../components/TeamSelector';
import VotePanel from '../components/VotePanel';
import VoteReveal from '../components/VoteReveal';
import QuestPanel from '../components/QuestPanel';
import QuestResult from '../components/QuestResult';
import AssassinPanel from '../components/AssassinPanel';
import InfoPanel from '../components/InfoPanel';
import GameLog from '../components/GameLog';
import ThrowProps from '../components/ThrowProps';

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

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Header - compact */}
      <div className="bg-nightLight border-b border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <RoundTracker results={view.missionResults} currentRound={view.currentRound} playerCount={view.totalPlayers} />
          <div className="text-slate-500 text-xs font-mono">{view.roomId}</div>
          <VoteTracker count={view.consecutiveRejections} />
        </div>
      </div>

      {/* Round Table */}
      <div className="px-2 py-1">
        <RoundTable
          players={view.players}
          leaderIndex={view.leaderIndex}
          proposedTeam={view.proposedTeam}
          knownPlayers={view.knownPlayers}
          totalPlayers={view.totalPlayers}
        />
      </div>

      {/* Phase content */}
      <div className="flex-1 px-4 py-2">
        <div className="max-w-lg mx-auto">
          {renderPhaseContent()}
        </div>
      </div>

      {/* Info panel */}
      <InfoPanel />

      {/* Game log */}
      <GameLog log={view.log} playerNames={view.players.map(p => p.name)} />

      {/* Throw props overlay */}
      <ThrowProps />
    </div>
  );
}
