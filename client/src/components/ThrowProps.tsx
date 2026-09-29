import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../socket';
import type { PropEvent } from '@shared/types';
import './ThrowProps.css';

interface ActiveProp extends PropEvent {
  key: string;
}

export default function ThrowProps() {
  const { view } = useGameStore();
  const [activeProps, setActiveProps] = useState<ActiveProp[]>([]);

  const getName = (id: string) => view?.players.find(p => p.id === id)?.name || '?';

  useEffect(() => {
    const socket = getSocket();
    const handler = (event: PropEvent) => {
      const key = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const prop: ActiveProp = { ...event, key };
      setActiveProps(prev => [...prev, prop]);
      setTimeout(() => {
        setActiveProps(prev => prev.filter(p => p.key !== key));
      }, 2500);
    };
    socket.on('prop:thrown', handler);
    return () => { socket.off('prop:thrown', handler); };
  }, []);

  if (activeProps.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {activeProps.map(prop => {
        const emoji = prop.propType === 'flower' ? '🌸' : '🥚';
        const burstEmoji = prop.propType === 'flower' ? '✨' : '💥';
        const targetName = getName(prop.targetId);

        return (
          <div key={prop.key} className="prop-event absolute inset-0 flex items-center justify-center">
            <div className="prop-fly text-5xl">{emoji}</div>
            <div className="prop-burst text-4xl">{burstEmoji}</div>
            <div className="prop-label absolute top-16 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
              {prop.propType === 'flower'
                ? `${prop.fromName} 送了鲜花 🌸 给 ${targetName}`
                : `${prop.fromName} 扔了鸡蛋 🥚 给 ${targetName}`
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}
