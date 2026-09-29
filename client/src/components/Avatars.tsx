import React from 'react';

export interface Avatar {
  id: number;
  name: string;
  gender: 'male' | 'female';
  bgColor: string;
  icon: string;
}

export const AVATARS: Avatar[] = [
  // Male (8)
  { id: 0, name: '亚瑟', gender: 'male', bgColor: 'bg-amber-600', icon: '♔' },
  { id: 1, name: '梅林', gender: 'male', bgColor: 'bg-purple-700', icon: '🔮' },
  { id: 2, name: '兰斯洛特', gender: 'male', bgColor: 'bg-blue-700', icon: '⚔' },
  { id: 3, name: '加拉哈德', gender: 'male', bgColor: 'bg-sky-600', icon: '🛡' },
  { id: 4, name: '崔斯坦', gender: 'male', bgColor: 'bg-emerald-700', icon: '🏹' },
  { id: 5, name: '高文', gender: 'male', bgColor: 'bg-orange-700', icon: '⚒' },
  { id: 6, name: '贝德维尔', gender: 'male', bgColor: 'bg-slate-600', icon: '🗡' },
  { id: 7, name: '凯', gender: 'male', bgColor: 'bg-yellow-700', icon: '📜' },

  // Female (8)
  { id: 8, name: '桂妮薇儿', gender: 'female', bgColor: 'bg-pink-600', icon: '♛' },
  { id: 9, name: '莫甘娜', gender: 'female', bgColor: 'bg-indigo-800', icon: '🌙' },
  { id: 10, name: '妮妙', gender: 'female', bgColor: 'bg-cyan-600', icon: '💧' },
  { id: 11, name: '伊索尔德', gender: 'female', bgColor: 'bg-rose-700', icon: '🌹' },
  { id: 12, name: '伊莲', gender: 'female', bgColor: 'bg-teal-600', icon: '🕊' },
  { id: 13, name: '薇薇安', gender: 'female', bgColor: 'bg-green-700', icon: '🌿' },
  { id: 14, name: '布兰文', gender: 'female', bgColor: 'bg-fuchsia-700', icon: '🎵' },
  { id: 15, name: '莉奈特', gender: 'female', bgColor: 'bg-red-700', icon: '🔥' },
];

export function getAvatar(id: number): Avatar {
  return AVATARS[id] || AVATARS[0];
}

export function randomAvatarId(): number {
  return Math.floor(Math.random() * AVATARS.length);
}

interface AvatarImageProps {
  avatarId: number;
  size?: 'sm' | 'md' | 'lg';
  ring?: string;
}

const SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-10 h-10 text-lg',
  lg: 'w-14 h-14 text-2xl',
};

export function AvatarImage({ avatarId, size = 'md', ring }: AvatarImageProps) {
  const avatar = getAvatar(avatarId);
  const sizeClass = SIZES[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center ${avatar.bgColor} ${sizeClass} ${ring || ''}`}
      title={avatar.name}
    >
      <span className="select-none">{avatar.icon}</span>
    </div>
  );
}
