import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { ROLE_INFO, ROLE_CONFIGS, ALL_GOOD_ROLES, ALL_EVIL_ROLES, validateRoleConfig } from '@shared/constants';
import type { Role, RoleConfig } from '@shared/types';

export default function RoleConfigurator() {
  const { view, playerId, setRoleConfig } = useGameStore();
  if (!view || view.hostId !== playerId) return null;

  const playerCount = view.totalPlayers;
  const defaultConfig = ROLE_CONFIGS[playerCount] || { good: [], evil: [] };
  const current = view.roleConfig || defaultConfig;

  const [config, setConfig] = useState<RoleConfig>({ good: [...current.good], evil: [...current.evil] });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig({ good: [...current.good], evil: [...current.evil] });
    setError(null);
    setSaved(false);
  }, [playerCount]);

  const updateCount = (role: Role, delta: number, alignment: 'good' | 'evil') => {
    setSaved(false);
    setConfig(prev => {
      const list = alignment === 'good' ? [...prev.good] : [...prev.evil];
      if (delta > 0) {
        list.push(role);
      } else {
        const idx = list.lastIndexOf(role);
        if (idx >= 0) list.splice(idx, 1);
      }
      const newConfig = alignment === 'good'
        ? { good: list, evil: [...prev.evil] }
        : { good: [...prev.good], evil: list };

      const err = validateRoleConfig(newConfig, playerCount);
      setError(err);
      return newConfig;
    });
  };

  const getCount = (role: Role, alignment: 'good' | 'evil') => {
    return (alignment === 'good' ? config.good : config.evil).filter(r => r === role).length;
  };

  const totalGood = config.good.length;
  const totalEvil = config.evil.length;
  const total = totalGood + totalEvil;

  const handleReset = () => {
    setConfig({ good: [...defaultConfig.good], evil: [...defaultConfig.evil] });
    setError(null);
    setSaved(false);
  };

  const handleConfirm = () => {
    const err = validateRoleConfig(config, playerCount);
    if (err) {
      setError(err);
      return;
    }
    setRoleConfig(config);
    setSaved(true);
  };

  const isDefault = JSON.stringify(config.good.sort()) === JSON.stringify([...defaultConfig.good].sort())
    && JSON.stringify(config.evil.sort()) === JSON.stringify([...defaultConfig.evil].sort());

  const renderRoleRow = (role: Role, alignment: 'good' | 'evil') => {
    const info = ROLE_INFO[role];
    const count = getCount(role, alignment);
    const locked = (role === 'merlin' || role === 'assassin');
    return (
      <div key={role} className="flex items-center justify-between py-1.5 px-2">
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${alignment === 'good' ? 'text-good-light' : 'text-evil-light'}`}>
            {info.name}
          </span>
          {locked && <span className="text-slate-500 text-[10px] ml-1">必选</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className={`w-6 h-6 rounded text-xs font-bold ${
              count === 0 || locked ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-600 text-white hover:bg-slate-500'
            }`}
            disabled={count === 0 || locked}
            onClick={() => updateCount(role, -1, alignment)}
          >−</button>
          <span className="text-sm font-mono w-4 text-center text-slate-300">{count}</span>
          <button
            className={`w-6 h-6 rounded text-xs font-bold ${
              total >= playerCount ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-600 text-white hover:bg-slate-500'
            }`}
            disabled={total >= playerCount}
            onClick={() => updateCount(role, 1, alignment)}
          >+</button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-sm mb-4">
      <div className="bg-nightLight rounded-xl border border-gold/20 p-4">
        <h3 className="font-serif text-gold text-center text-sm mb-3">⚙ 身份配置</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-good-light text-xs font-semibold mb-1 text-center">善良方 ({totalGood})</div>
            <div className="space-y-0.5">
              {ALL_GOOD_ROLES.map(r => renderRoleRow(r, 'good'))}
            </div>
          </div>
          <div>
            <div className="text-evil-light text-xs font-semibold mb-1 text-center">邪恶方 ({totalEvil})</div>
            <div className="space-y-0.5">
              {ALL_EVIL_ROLES.map(r => renderRoleRow(r, 'evil'))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 mb-2">
          总计 {total} / {playerCount} 人
        </div>

        {error && (
          <div className="text-evil-light text-xs text-center mb-2 bg-evil/10 rounded px-2 py-1">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            className={`flex-1 py-1.5 rounded text-sm ${
              isDefault ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-600 text-white hover:bg-slate-500'
            }`}
            disabled={isDefault}
            onClick={handleReset}
          >恢复默认</button>
          <button
            className={`flex-1 py-1.5 rounded text-sm font-semibold ${
              error || total !== playerCount
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : saved ? 'bg-good/30 text-good-light' : 'btn-gold'
            }`}
            disabled={!!error || total !== playerCount}
            onClick={handleConfirm}
          >{saved ? '✓ 已应用' : '确认配置'}</button>
        </div>
      </div>
    </div>
  );
}
