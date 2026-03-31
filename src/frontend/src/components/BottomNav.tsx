import { History, Home, User, Zap } from "lucide-react";
import type { AppTab } from "../App";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
  { id: "wingo", label: "WinGo", icon: <Zap className="w-5 h-5" /> },
  { id: "history", label: "My History", icon: <History className="w-5 h-5" /> },
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="flex-shrink-0 flex items-center gradient-header"
      data-ocid="nav.section"
      style={{
        minHeight: "60px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            data-ocid={`nav.${tab.id}.tab`}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all"
          >
            <span
              style={{
                color: isActive
                  ? "oklch(var(--game-cyan))"
                  : "rgba(255,255,255,0.5)",
                filter: isActive
                  ? "drop-shadow(0 0 6px oklch(var(--game-cyan) / 0.7))"
                  : "none",
              }}
            >
              {tab.icon}
            </span>
            <span
              className="text-[10px] font-semibold leading-none"
              style={{
                color: isActive
                  ? "oklch(var(--game-cyan))"
                  : "rgba(255,255,255,0.5)",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
