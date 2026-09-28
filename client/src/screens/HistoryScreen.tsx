import { useState, useEffect } from 'react';

interface GameSummary {
  id: string;
  roomId: string;
  playerCount: number;
  winner: string | null;
  winReason: string | null;
  players: { name: string }[];
  createdAt: number;
  finishedAt: number | null;
}

interface GameDetail {
  id: string;
  roomId: string;
  playerCount: number;
  winner: string | null;
  winReason: string | null;
  players: { id: string; name: string; seatIndex: number }[];
  fullState: any;
  events: any[];
  createdAt: number;
  finishedAt: number | null;
}

interface Props {
  onBack: () => void;
}

export default function HistoryScreen({ onBack }: Props) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = window.location.origin;

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/games`);
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      setError('加载失败，请检查网络连接');
    }
    setLoading(false);
  }

  async function viewDetail(gameId: string) {
    setDetailLoading(true);
    setSelectedGame(null);
    try {
      const res = await fetch(`${apiBase}/api/games/${gameId}`);
      const data = await res.json();
      setSelectedGame(data);
    } catch {
      setError('加载详情失败');
    }
    setDetailLoading(false);
  }

  function exportGame(gameId: string) {
    window.open(`${apiBase}/api/games/${gameId}/export`, '_blank');
  }

  function formatDate(timestamp: number) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function winnerLabel(winner: string | null) {
    if (winner === 'good') return { text: '善良方胜', color: 'text-good' };
    if (winner === 'evil') return { text: '邪恶方胜', color: 'text-evil' };
    return { text: '未完成', color: 'text-slate-400' };
  }

  // Detail view
  if (selectedGame) {
    const state = selectedGame.fullState;
    return (
      <div className="min-h-screen px-4 py-6 fade-in">
        <button className="text-slate-400 hover:text-white mb-4" onClick={() => setSelectedGame(null)}>
          ← 返回列表
        </button>

        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl text-gold text-center mb-2">
            房间 {selectedGame.roomId}
          </h2>
          <p className="text-center text-slate-400 text-sm mb-4">
            {formatDate(selectedGame.createdAt)} · {selectedGame.playerCount}人
          </p>

          <div className={`text-center text-lg font-bold mb-6 ${winnerLabel(selectedGame.winner).color}`}>
            {winnerLabel(selectedGame.winner).text}
            {selectedGame.winReason && (
              <span className="text-sm text-slate-400 ml-2">({selectedGame.winReason})</span>
            )}
          </div>

          {/* Players & Roles */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
            <h3 className="font-serif text-gold-light mb-3">玩家身份</h3>
            <div className="space-y-2">
              {state?.roles?.map((r: any) => {
                const player = selectedGame.players.find(p => p.id === r.playerId);
                const isEvil = r.alignment === 'evil';
                const roleName = getRoleName(r.role);
                return (
                  <div key={r.playerId} className="flex justify-between items-center">
                    <span className="text-white">{player?.name || '未知'}</span>
                    <span className={isEvil ? 'text-evil' : 'text-good'}>
                      {roleName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mission Results */}
          {state?.missionResults?.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <h3 className="font-serif text-gold-light mb-3">任务结果</h3>
              <div className="flex gap-2 justify-center">
                {state.missionResults.map((mr: any, i: number) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      mr.success
                        ? 'bg-good/20 text-good border border-good'
                        : 'bg-evil/20 text-evil border border-evil'
                    }`}
                  >
                    {mr.success ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Log */}
          {state?.log?.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <h3 className="font-serif text-gold-light mb-3">游戏日志</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto text-sm">
                {state.log.map((entry: any, i: number) => (
                  <p key={i} className="text-slate-300">
                    {entry.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn-gold w-full"
            onClick={() => exportGame(selectedGame.id)}
          >
            导出游戏记录
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen px-4 py-6 fade-in">
      <button className="text-slate-400 hover:text-white mb-4" onClick={onBack}>
        ← 返回首页
      </button>

      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl text-gold text-center mb-6">游戏历史</h1>

        {error && (
          <div className="bg-evil/20 border border-evil text-evil-light px-4 py-3 rounded-lg mb-4 text-center">
            {error}
            <button className="ml-2 underline" onClick={() => { setError(null); fetchGames(); }}>
              重试
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-slate-400 py-8">加载中...</div>
        )}

        {detailLoading && (
          <div className="text-center text-slate-400 py-8">加载详情...</div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p className="text-4xl mb-4">📜</p>
            <p>暂无游戏记录</p>
            <p className="text-sm mt-2">完成一局游戏后记录会出现在这里</p>
          </div>
        )}

        <div className="space-y-3">
          {games.map((game) => {
            const wl = winnerLabel(game.winner);
            return (
              <div
                key={game.id}
                className="bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => viewDetail(game.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">
                      房间 <span className="font-mono text-gold">{game.roomId}</span>
                    </div>
                    <div className="text-slate-400 text-sm mt-1">
                      {formatDate(game.createdAt)} · {game.playerCount}人
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {game.players.map(p => p.name).join('、')}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${wl.color}`}>
                    {wl.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getRoleName(role: string): string {
  const names: Record<string, string> = {
    merlin: '梅林',
    percival: '派西维尔',
    loyal_servant: '忠臣',
    morgana: '莫甘娜',
    assassin: '刺客',
    minion_of_mordred: '莫德雷德的爪牙',
    oberon: '奥伯伦',
  };
  return names[role] || role;
}