import { useState, useEffect } from 'react';
import { useGameStore } from './stores/gameStore';
import { connectSocket } from './socket';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoleRevealScreen from './screens/RoleRevealScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';
import HistoryScreen from './screens/HistoryScreen';
import ChatPanel from './components/ChatPanel';
import { preloadAvatars } from './components/Avatars';

function App() {
  const { view, playerName, setPlayerInfo, setConnected, updateView, setError, reconnect } = useGameStore();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    preloadAvatars();
    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      try {
        const savedPlayerId = sessionStorage.getItem('avalon_playerId');
        const savedRoomId = sessionStorage.getItem('avalon_roomId');
        if (savedPlayerId && savedRoomId) {
          reconnect(savedRoomId, savedPlayerId);
        }
      } catch {}
    };

    const onDisconnect = () => setConnected(false);
    const onRoomCreated = (data: any) => {
      const state = useGameStore.getState();
      const avatar = parseInt(sessionStorage.getItem('avalon_avatar') || '0', 10);
      setPlayerInfo(data.playerId, state.playerName || '', data.roomId, avatar);
    };
    const onRoomJoined = (data: any) => {
      const state = useGameStore.getState();
      const avatar = parseInt(sessionStorage.getItem('avalon_avatar') || '0', 10);
      setPlayerInfo(data.playerId, state.playerName || '', state.roomId || '', avatar);
    };
    const onRoomError = (data: any) => {
      setError(data.message);
      // If reconnect failed, clear saved session so user can start fresh
      try {
        const savedPlayerId = sessionStorage.getItem('avalon_playerId');
        if (savedPlayerId && !useGameStore.getState().view) {
          sessionStorage.removeItem('avalon_playerId');
          sessionStorage.removeItem('avalon_playerName');
          sessionStorage.removeItem('avalon_roomId');
          sessionStorage.removeItem('avalon_avatar');
        }
      } catch {}
    };
    const onGameState = (newView: any) => { updateView(newView); setError(null); };
    const onGameError = (data: any) => setError(data.message);
    const onRoomKicked = (data: any) => {
      setError(data.reason || '你被踢出了房间');
      // Clear local state without sending room:leave (socket already closed by server)
      useGameStore.setState({ playerId: null, playerName: null, roomId: null, view: null });
      try {
        sessionStorage.removeItem('avalon_playerId');
        sessionStorage.removeItem('avalon_playerName');
        sessionStorage.removeItem('avalon_roomId');
        sessionStorage.removeItem('avalon_avatar');
      } catch {}
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:created', onRoomCreated);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:error', onRoomError);
    socket.on('room:kicked', onRoomKicked);
    socket.on('game:state', onGameState);
    socket.on('game:error', onGameError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:error', onRoomError);
      socket.off('room:kicked', onRoomKicked);
      socket.off('game:state', onGameState);
      socket.off('game:error', onGameError);
    };
  }, []);

  if (showHistory) {
    return (
      <div className="min-h-screen bg-night">
        <HistoryScreen onBack={() => setShowHistory(false)} />
      </div>
    );
  }

  const renderScreen = () => {
    if (!view) {
      return <HomeScreen onHistory={() => setShowHistory(true)} />;
    }

    switch (view.phase) {
      case 'lobby':
        return <LobbyScreen />;
      case 'role_reveal':
        return <RoleRevealScreen />;
      case 'game_over':
        return <EndScreen />;
      case 'assassination':
      case 'team_selection':
      case 'voting':
      case 'vote_reveal':
      case 'quest':
      case 'quest_result':
        return <GameScreen />;
      default:
        return <GameScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-night">
      {renderScreen()}
      {view && <ChatPanel />}
    </div>
  );
}

export default App;
