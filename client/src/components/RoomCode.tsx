interface RoomCodeProps {
  code: string;
}

export default function RoomCode({ code }: RoomCodeProps) {
  return (
    <div className="text-center mb-4">
      <p className="text-slate-400 text-xs mb-1">房间码</p>
      <div className="font-mono text-4xl tracking-[0.2em] text-gold font-bold">
        {code}
      </div>
    </div>
  );
}
