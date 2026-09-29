import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../stores/gameStore';
import RoomCode from '../components/RoomCode';
import PlayerList from '../components/PlayerList';
import RoleConfigurator from '../components/RoleConfigurator';

export default function LobbyScreen() {
  const { view, playerId, startGame, leaveRoom, error } = useGameStore();
  const [showQR, setShowQR] = useState(false);
  const [shareTip, setShareTip] = useState('');

  // Build join URL with room code as parameter
  const joinUrl = useMemo(() => {
    if (!view) return '';
    const base = window.location.origin;
    return `${base}/?room=${view.roomId}`;
  }, [view?.roomId]);

  if (!view) return null;

  const isHost = view.hostId === playerId;
  const playerCount = view.players.length;
  const canStart = playerCount >= 5 && playerCount <= 10;

  const shareText = view.roomName
    ? `来玩阿瓦隆！「${view.roomName}」房间 ${view.roomId}`
    : `来玩阿瓦隆！房间码 ${view.roomId}`;

  async function handleShare() {
    // Try native Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: '阿瓦隆 - 加入房间',
          text: shareText,
          url: joinUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${joinUrl}`);
      setShareTip('链接已复制，快去粘贴分享吧！');
    } catch {
      // Clipboard API failed, show manual copy
      setShareTip(joinUrl);
    }
    setTimeout(() => setShareTip(''), 3000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 fade-in">
      {/* Room Code */}
      <RoomCode code={view.roomId} />

      {/* Room name */}
      {view.roomName && (
        <p className="text-gold-light font-serif text-sm mb-2">{view.roomName}</p>
      )}

      {/* Share & QR Code */}
      <div className="flex gap-3 mb-3">
        <button
          className="text-gold text-sm underline underline-offset-2"
          onClick={() => setShowQR(!showQR)}
        >
          {showQR ? '隐藏二维码' : '显示二维码'}
        </button>
        <span className="text-slate-600">|</span>
        <button
          className="text-gold text-sm underline underline-offset-2"
          onClick={handleShare}
        >
          📤 一键分享
        </button>
      </div>

      {shareTip && (
        <div className="bg-good/20 border border-good text-good-light px-4 py-2 rounded-lg mb-3 text-sm text-center max-w-sm fade-in">
          {shareTip}
        </div>
      )}

      {showQR && (
        <div className="bg-white p-4 rounded-xl mb-4 fade-in">
          <QRCodeSVG value={joinUrl} size={180} />
        </div>
      )}

      {/* Player count */}
      <p className="text-slate-400 mb-4">
        {playerCount} / 10 名玩家
        {!canStart && playerCount < 5 && (
          <span className="text-gold"> （还需 {5 - playerCount} 人）</span>
        )}
      </p>

      {/* Player list */}
      <div className="w-full max-w-sm mb-4">
        <PlayerList players={view.players} leaderIndex={-1} proposedTeam={[]} knownPlayers={{}} totalPlayers={view.players.length} />
      </div>

      {/* Role configuration (host only) */}
      <RoleConfigurator />

      {/* Error */}
      {error && (
        <div className="bg-evil/20 border border-evil text-evil-light px-4 py-3 rounded-lg mb-4 w-full max-w-sm text-center text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        {isHost ? (
          <button
            className="btn-gold w-full text-lg"
            onClick={startGame}
            disabled={!canStart}
          >
            {canStart ? '开始游戏' : `等待更多玩家 (${playerCount}/5)`}
          </button>
        ) : (
          <div className="text-center text-slate-400 py-3">
            等待房主开始游戏...
          </div>
        )}

        <button
          className="text-slate-500 hover:text-evil-light w-full py-2 text-sm"
          onClick={leaveRoom}
        >
          离开房间
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-auto pt-6 text-center">
        <p className="text-slate-500 text-xs">
          让朋友扫码或输入房间码 <span className="font-mono text-gold">{view.roomId}</span> 加入
        </p>
        <p className="text-slate-600 text-xs mt-1">
          需要 5-10 人才能开始游戏
        </p>
      </div>
    </div>
  );
}
