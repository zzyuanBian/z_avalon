import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { AVATARS, AvatarImage, randomAvatarId } from '../components/Avatars';

interface Props {
  onHistory?: () => void;
}

export default function HomeScreen({ onHistory }: Props) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(() => randomAvatarId());
  const { createRoom, joinRoom, error, setError } = useGameStore();

  // Check for room code in URL (from QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl.toUpperCase());
      setMode('join');
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError('请输入昵称');
      return;
    }
    try { sessionStorage.setItem('avalon_avatar', String(selectedAvatar)); } catch {}
    createRoom(playerName.trim(), roomName.trim(), selectedAvatar);
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomId.trim()) {
      setError('请输入房间码');
      return;
    }
    try { sessionStorage.setItem('avalon_avatar', String(selectedAvatar)); } catch {}
    joinRoom(roomId.trim().toUpperCase(), playerName.trim(), selectedAvatar);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 fade-in">
      {/* Logo / Title */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">⚔</div>
        <h1 className="font-serif text-4xl font-bold text-gold">阿瓦隆</h1>
        <p className="text-slate-400 mt-2">桌游助手</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-evil/20 border border-evil text-evil-light px-4 py-3 rounded-lg mb-4 w-full max-w-sm text-center">
          {error}
        </div>
      )}

      {mode === 'home' && (
        <div className="w-full max-w-sm space-y-4">
          <button
            className="btn-primary w-full text-lg"
            onClick={() => setMode('create')}
          >
            创建房间
          </button>
          <button
            className="btn-gold w-full text-lg"
            onClick={() => setMode('join')}
          >
            加入房间
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-sm space-y-4 fade-in">
          <h2 className="font-serif text-xl text-center text-gold-light">创建新房间</h2>
          <input
            className="input-field text-center text-lg"
            placeholder="房间名称（选填）"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={30}
          />
          <input
            className="input-field text-center text-lg"
            placeholder="你的昵称"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          {/* Avatar picker */}
          <div>
            <div className="text-slate-400 text-xs text-center mb-2">选择头像</div>
            {/* Selected preview */}
            <div className="flex justify-center mb-2">
              <AvatarImage avatarId={selectedAvatar} size="lg" ring="ring-2 ring-gold" />
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-[80px] overflow-y-auto px-1 py-1">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`transition-all ${
                    selectedAvatar === av.id ? '' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={av.name}
                >
                  <AvatarImage
                    avatarId={av.id}
                    size="sm"
                    ring={selectedAvatar === av.id ? 'ring-2 ring-gold' : ''}
                  />
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={handleCreate}>
            创建
          </button>
          <button
            className="text-slate-400 hover:text-white w-full py-2"
            onClick={() => { setMode('home'); setError(null); setRoomName(''); }}
          >
            返回
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-sm space-y-4 fade-in">
          <h2 className="font-serif text-xl text-center text-gold-light">
            加入房间
            {roomId && <span className="text-gold font-mono ml-2">({roomId})</span>}
          </h2>
          <input
            className="input-field text-center text-lg"
            placeholder="输入你的昵称"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          {/* Avatar picker */}
          <div>
            <div className="text-slate-400 text-xs text-center mb-2">选择头像</div>
            {/* Selected preview */}
            <div className="flex justify-center mb-2">
              <AvatarImage avatarId={selectedAvatar} size="lg" ring="ring-2 ring-gold" />
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-[80px] overflow-y-auto px-1 py-1">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`transition-all ${
                    selectedAvatar === av.id ? '' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={av.name}
                >
                  <AvatarImage
                    avatarId={av.id}
                    size="sm"
                    ring={selectedAvatar === av.id ? 'ring-2 ring-gold' : ''}
                  />
                </button>
              ))}
            </div>
          </div>
          <input
            className="input-field text-center text-2xl tracking-[0.3em] font-mono uppercase"
            placeholder="房间码"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            maxLength={5}
          />
          <button className="btn-gold w-full" onClick={handleJoin}>
            加入
          </button>
          <button
            className="text-slate-400 hover:text-white w-full py-2"
            onClick={() => { setMode('home'); setError(null); setRoomId(''); }}
          >
            返回
          </button>
        </div>
      )}

      <p className="text-slate-500 text-xs mt-8">5-10人 · 适合线下聚会</p>

      {onHistory && (
        <button
          className="text-slate-500 hover:text-gold text-sm mt-4 transition-colors"
          onClick={onHistory}
        >
          📜 游戏历史
        </button>
      )}
    </div>
  );
}
