// trash/components/TrashHeader.tsx
import React from "react";

const TrashHeader: React.FC = () => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 mb-6">
    <div
      className="absolute inset-0 opacity-75"
      style={{
        background:
          "linear-gradient(90deg,#06b6d4,#4f46e5,#a855f7,#4f46e5,#06b6d4)",
        backgroundSize: "300% 100%",
        animation: "moveX 16s linear infinite",
      }}
    />
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
    <div className="relative px-6 py-7 md:px-10 md:py-9">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-sky-300">
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <path
              d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-sky-50">
            Trash
          </h1>
          <p className="text-slate-200/85">
            Các mục trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày.
          </p>
        </div>
      </div>
    </div>
    <div className="relative h-[3px] rounded-b-2xl overflow-hidden">
      <div
        className="absolute top-0 left-[-35%] h-[3px] w-[35%] rounded-full"
        style={{
          background: "linear-gradient(90deg,#22d3ee,#a855f7,#22d3ee)",
          animation: "sweepX 2.8s linear infinite",
        }}
      />
    </div>
  </div>
);

export default TrashHeader;
