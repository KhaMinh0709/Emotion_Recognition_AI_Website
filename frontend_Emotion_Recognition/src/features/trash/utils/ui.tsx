// trash/ui.tsx
import React from "react";

/* =================== Design Tokens =================== */
export const tokens = {
  card:
    "rounded-2xl bg-slate-800/60 backdrop-blur-md border border-white/10 shadow-xl",
  title: "text-2xl md:text-3xl font-semibold tracking-tight text-sky-200",
  btn: {
    primary:
      "px-4 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium shadow-lg shadow-sky-900/20 disabled:opacity-60 disabled:pointer-events-none",
    ghost:
      "px-4 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-100 border border-white/10",
    danger:
      "px-4 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-900/30 disabled:opacity-60 disabled:pointer-events-none",
    subtle:
      "px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10",
    icon:
      "inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200",
  },
};

export const cn = (...c: Array<string | null | undefined | false>) =>
  c.filter(Boolean).join(" ");

export const KEYFRAMES = `
@keyframes moveX{0%{background-position:0% 0%}100%{background-position:300% 0%}}
@keyframes sweepX{0%{left:-35%}100%{left:100%}}
`;

/* =================== Icons =================== */
export const ICON = {
  folder: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300">
      <path
        fill="currentColor"
        d="M10 4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z"
      />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-300">
      <path
        fill="currentColor"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      />
      <path fill="currentColor" d="M14 2v6h6" />
    </svg>
  ),
  notebook: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-300">
      <path
        fill="currentColor"
        d="M4 3h12a2 2 0 012 2v14a2 2 0 01-2 2H4V3z"
      />
      <path
        fill="currentColor"
        d="M20 6h-2v12h2a1 1 0 001-1V7a1 1 0 00-1-1z"
      />
    </svg>
  ),
} as const;

/* =================== Format helpers =================== */
export function fmtBytes(bytes: number | null | undefined) {
  if (bytes == null) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}
