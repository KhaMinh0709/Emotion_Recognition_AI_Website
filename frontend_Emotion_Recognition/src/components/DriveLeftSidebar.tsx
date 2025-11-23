
import { useMemo, useState } from "react";
import {
  Plus,
  Home as HomeIcon,
  LayoutDashboard,
  Mic,
  Image,
  Film,
  ShieldAlert,
  ScrollText,
  Trash2,
  Users,
  Settings,
  Bell,
  HelpCircle,
  Upload,
  Video,
  Music,
} from "lucide-react";
import "../types/drive-sidebar.css";
import SettingsButton from "./SettingsButton";
import HelpButton from "./HelpButton";

export type ItemKey =
  | "home"
  | "dashboard"
  | "new-analysis"
  | "text-sentiment"
  | "audio-sentiment"
  | "vision-sentiment"
  | "fused-model"
  | "max-fusion"
  | "review-queue"
  | "trash"
  | "storage"
  | "storage-upgrade"
  | "log"
  | "users";

type SidebarItem = {
  key: ItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const VISIBLE_ITEMS: SidebarItem[] = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "audio-sentiment", label: "Audio Sentiment", icon: Mic },
  { key: "vision-sentiment", label: "Vision Sentiment", icon: Image },
  { key: "max-fusion", label: "Max Fusion (Video)", icon: Film },
  { key: "trash", label: "Trash", icon: Trash2 },
];

export interface DriveLeftSidebarProps {
  active?: ItemKey;
  onChange?: (key: ItemKey) => void;
  className?: string;
  onUploadClick?: () => void;
  onRecord?: (mode: "video" | "audio") => void;
}

export default function DriveLeftSidebar({
  active = "home",
  onChange,
  className = "",
  onUploadClick,
  onRecord,
}: DriveLeftSidebarProps) {
  const [open, setOpen] = useState(true);
  const items = useMemo(() => VISIBLE_ITEMS, []);

  const Item = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon;
    const isActive = active === item.key;

    return (
      <button
        onClick={() => onChange?.(item.key)}
        className={[
          "relative w-full overflow-hidden rounded-xl px-3 py-2.5",
          "flex items-center gap-3 transition-all duration-300 group",
          "text-[15.5px]", // chữ to hơn
          isActive
            ? "bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-fuchsia-600/10 text-white ring-1 ring-inset ring-indigo-400/40"
            : "text-slate-200/85 hover:text-white hover:bg-white/5",
        ].join(" ")}
      >
        <span
          className={[
            "absolute left-0 top-0 h-full w-[3px] rounded-r",
            "bg-gradient-to-b from-fuchsia-400 via-purple-400 to-sky-400",
            "transition-transform duration-300",
            isActive ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100",
          ].join(" ")}
        />
        <span
          className="pointer-events-none absolute -inset-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl
                     bg-[radial-gradient(70px_70px_at_left,theme(colors.sky.500/.16),transparent),radial-gradient(90px_90px_at_right,theme(colors.fuchsia.500/.14),transparent)]"
          aria-hidden
        />
        <Icon className="h-5 w-5 shrink-0 text-current" />
        <span className="flex-1 text-left tracking-tight">{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 border border-white/10 text-gray-100">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={[
        "drive-sidebar relative h-full w-72 min-w-60 max-w-80",
        "bg-[rgba(8,12,28,0.6)] backdrop-blur-xl",
        "border-r border-slate-800/70",
        "overflow-hidden",
        "flex flex-col",
        className,
      ].join(" ")}
    >
      {/* particles */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white/12 rounded-full animate-float-slow"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 80}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: `${8 + (i % 7)}s`,
            }}
          />
        ))}
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between px-3 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 grid place-items-center text-white font-semibold">
            EA
          </div>
          <div className="leading-tight">
            <div className="text-[14.5px] font-semibold text-white">Emotion AI</div>
            <div className="text-[11.5px] text-slate-400">Recognition Suite</div>
          </div>
        </div>
        <button
          onClick={() => onChange?.("new-analysis")}
          className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-sky-500 grid place-items-center text-white shadow-lg shadow-fuchsia-500/20 ring-1 ring-white/10 hover:scale-[1.02] transition"
          aria-label="New analysis"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className="px-3 pb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => (onUploadClick ? onUploadClick() : onChange?.("home"))}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11.5px] transition-all ring-1 ring-inset ring-white/10"
        >
          <Upload className="w-5 h-5 text-sky-400" />
          <span>Upload</span>
        </button>
        <button
          onClick={() => (onRecord ? onRecord("video") : onChange?.("max-fusion"))}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11.5px] transition-all ring-1 ring-inset ring-white/10"
        >
          <Video className="w-5 h-5 text-emerald-400" />
          <span>Video</span>
        </button>
        <button
          onClick={() => (onRecord ? onRecord("audio") : onChange?.("audio-sentiment"))}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11.5px] transition-all ring-1 ring-inset ring-white/10"
        >
          <Music className="w-5 h-5 text-rose-400" />
          <span>Audio</span>
        </button>
      </div>

      {/* MENU */}
      <nav className={`${open ? "block" : "hidden md:block"} px-3 space-y-1`}>
        {items.map((item) => (
          <Item key={item.key} item={item} />
        ))}
      </nav>

      {/* BOTTOM – dính sát đáy, đi theo 1 cột */}
      <div className="mt-auto pt-4">
        <div className="h-px w-full bg-slate-800/60 mb-3 mx-3" />

        {/* 3 nút dọc */}
        <div className="px-3 flex flex-col gap-2 mb-3">
          <SettingsButton
            onChange={(s) => console.log("Saved settings:", s)}
            renderTrigger={({ onClick }) => (
              <button
                onClick={onClick}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-white/5 transition text-[14.5px]"
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Settings</span>
              </button>
            )}
          />

          <button
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-white/5 transition text-[14.5px]"
            onClick={() => console.log("Notifications")}
          >
            <Bell className="w-4.5 h-4.5" />
            <span>Notifications</span>
          </button>

          <HelpButton
            renderTrigger={({ onClick }) => (
              <button
                onClick={onClick}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-white/5 transition text-[14.5px]"
              >
                <HelpCircle className="w-4.5 h-4.5" />
                <span>Support</span>
              </button>
            )}
          />
        </div>

        {/* account card */}
        <div className="px-3 pb-3">
          <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 grid place-items-center text-sm font-semibold">
              M
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-sm text-white">minh.nguyen</p>
              <p className="text-[11px] text-emerald-300 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 inline-block" />
                Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* local styles */}
      <style>{`
        .h-4.5 { height: 1.125rem; }
        .w-4.5 { width: 1.125rem; }
        @keyframes floatSlow {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        .animate-float-slow { animation: floatSlow 7.5s ease-in-out infinite; }
      `}</style>
    </aside>
  );
}
