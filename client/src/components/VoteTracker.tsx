interface VoteTrackerProps {
  count: number;
}

export default function VoteTracker({ count }: VoteTrackerProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            i <= count
              ? 'bg-evil text-white'
              : 'bg-slate-700 text-slate-500'
          }`}
          title={i <= count ? '已拒绝' : '未使用'}
        >
          {i <= count ? '✗' : ''}
        </div>
      ))}
    </div>
  );
}
