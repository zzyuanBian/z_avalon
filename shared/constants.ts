import type { Role, RoleConfig } from './types';

export const ALL_GOOD_ROLES: Role[] = ['merlin', 'percival', 'loyal_servant'];
export const ALL_EVIL_ROLES: Role[] = ['morgana', 'assassin', 'minion_of_mordred', 'oberon'];

export const PROPS_LIMIT = { flower: 3, egg: 3 };

export const ROLE_CONFIGS: Record<number, { good: Role[]; evil: Role[] }> = {
  5:  { good: ['merlin', 'percival', 'loyal_servant'],
        evil: ['morgana', 'assassin'] },
  6:  { good: ['merlin', 'percival', 'loyal_servant', 'loyal_servant'],
        evil: ['morgana', 'assassin'] },
  7:  { good: ['merlin', 'percival', 'loyal_servant', 'loyal_servant'],
        evil: ['morgana', 'assassin', 'minion_of_mordred'] },
  8:  { good: ['merlin', 'percival', 'loyal_servant', 'loyal_servant', 'loyal_servant'],
        evil: ['morgana', 'assassin', 'minion_of_mordred'] },
  9:  { good: ['merlin', 'percival', 'loyal_servant', 'loyal_servant',
               'loyal_servant', 'loyal_servant'],
        evil: ['morgana', 'assassin', 'minion_of_mordred'] },
  10: { good: ['merlin', 'percival', 'loyal_servant', 'loyal_servant',
               'loyal_servant', 'loyal_servant'],
        evil: ['morgana', 'assassin', 'minion_of_mordred', 'oberon'] },
};

export const TEAM_SIZES: Record<number, number[]> = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

export function failsRequired(playerCount: number, round: number): number {
  if (round === 4 && playerCount >= 7) return 2;
  return 1;
}

export const MAX_ROUNDS = 5;
export const WINS_NEEDED = 3;
export const MAX_CONSECUTIVE_REJECTIONS = 5;
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;
export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export const ROLE_INFO: Record<Role, {
  name: string; alignment: 'good' | 'evil'; description: string
}> = {
  merlin: {
    name: '梅林', alignment: 'good',
    description: '你知道谁是邪恶方。引导善良方获胜，但不要暴露自己！',
  },
  percival: {
    name: '派西维尔', alignment: 'good',
    description: '你知道谁是梅林（和可能的莫甘娜）。保护梅林不被刺杀！',
  },
  loyal_servant: {
    name: '忠诚骑士', alignment: 'good',
    description: '没有特殊信息。用智慧找出邪恶方，保护梅林！',
  },
  morgana: {
    name: '莫甘娜', alignment: 'evil',
    description: '你在派西维尔眼中伪装成梅林。迷惑善良方！',
  },
  assassin: {
    name: '刺客', alignment: 'evil',
    description: '如果邪恶方即将失败，刺杀梅林来翻盘获胜！',
  },
  minion_of_mordred: {
    name: '莫德雷德爪牙', alignment: 'evil',
    description: '梅林看不到你。在暗处破坏善良方的计划！',
  },
  oberon: {
    name: '奥伯伦', alignment: 'evil',
    description: '你是邪恶方，但其他邪恶队友也看不到你。独自潜伏！',
  },
};

export function validateRoleConfig(config: RoleConfig, playerCount: number): string | null {
  const allRoles = [...config.good, ...config.evil];
  if (allRoles.length !== playerCount) {
    return `角色总数（${allRoles.length}）与玩家数（${playerCount}）不匹配`;
  }
  if (!config.good.includes('merlin')) return '必须包含梅林';
  if (!config.evil.includes('assassin')) return '必须包含刺客';
  const validRoles = [...ALL_GOOD_ROLES, ...ALL_EVIL_ROLES];
  for (const r of allRoles) {
    if (!validRoles.includes(r)) return `无效角色: ${r}`;
  }
  for (const r of config.good) {
    if (ALL_EVIL_ROLES.includes(r)) return `角色 ${ROLE_INFO[r].name} 属于邪恶方`;
  }
  for (const r of config.evil) {
    if (ALL_GOOD_ROLES.includes(r)) return `角色 ${ROLE_INFO[r].name} 属于善良方`;
  }
  if (config.good.length <= config.evil.length) {
    return '善良方人数必须多于邪恶方';
  }
  return null;
}
