import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../socket';
import type { ChatMessage } from '@shared/types';

export default function ChatPanel() {
  const { view, playerId, sendChatMessage } = useGameStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync from view on mount and reconnect
  useEffect(() => {
    if (view?.chatMessages) {
      setMessages(view.chatMessages);
    }
  }, [view?.chatMessages]);

  // Listen for real-time messages
  useEffect(() => {
    const socket = getSocket();
    const handler = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (!open) {
        setUnread(prev => prev + 1);
      }
    };
    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset unread on open
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  if (!view) return null;

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendChatMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-gold text-night font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          onClick={() => setOpen(true)}
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-evil text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-end justify-center" onClick={() => setOpen(false)}>
          <div
            className="bg-nightLight w-full max-w-sm rounded-t-2xl flex flex-col fade-in"
            style={{ maxHeight: '70vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="font-serif text-gold text-sm">💬 聊天</h3>
              <button className="text-slate-400 hover:text-white text-lg" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" style={{ minHeight: '200px' }}>
              {messages.length === 0 && (
                <div className="text-slate-500 text-xs text-center py-8">暂无消息，发一条吧！</div>
              )}
              {messages.map(msg => {
                const isMe = msg.playerId === playerId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-slate-500 text-[10px] mb-0.5 px-1">{msg.playerName}</span>
                    <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm break-words ${
                      isMe
                        ? 'bg-gold/20 text-gold-light rounded-br-sm'
                        : 'bg-slate-700 text-slate-200 rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="flex gap-2 px-3 py-3 border-t border-slate-700">
              <input
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold/50"
                placeholder="输入消息..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={200}
              />
              <button
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  input.trim() ? 'btn-gold' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
                disabled={!input.trim()}
                onClick={handleSend}
              >发送</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
