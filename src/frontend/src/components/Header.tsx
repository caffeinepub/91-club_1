import { ChevronRight, Dices } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "../backend.d";
import { useBalance } from "../hooks/useQueries";

interface HeaderProps {
  profile: UserProfile;
}

export default function Header({ profile }: HeaderProps) {
  const { data: balanceData } = useBalance();
  const balance =
    balanceData !== undefined ? Number(balanceData) : Number(profile.balance);
  const prevBalanceRef = useRef<number>(balance);
  const [flashState, setFlashState] = useState<"win" | "loss" | null>(null);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    if (prev !== balance) {
      if (balance > prev) {
        setFlashState("win");
      } else if (balance < prev) {
        setFlashState("loss");
      }
      prevBalanceRef.current = balance;
      const t = setTimeout(() => setFlashState(null), 800);
      return () => clearTimeout(t);
    }
  }, [balance]);

  const flashStyle: React.CSSProperties =
    flashState === "win"
      ? {
          boxShadow:
            "0 0 0 2px oklch(0.75 0.22 145), 0 0 12px oklch(0.75 0.22 145 / 0.5)",
          transition: "box-shadow 0.3s ease",
        }
      : flashState === "loss"
        ? {
            boxShadow:
              "0 0 0 2px oklch(0.65 0.22 25), 0 0 12px oklch(0.65 0.22 25 / 0.5)",
            transition: "box-shadow 0.3s ease",
          }
        : { boxShadow: "none", transition: "box-shadow 0.5s ease" };

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 py-3 gradient-header"
      data-ocid="header.section"
      style={{ minHeight: "56px" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15">
          <Dices className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-extrabold font-display leading-none text-accent">
            91
          </span>
          <span className="text-xl font-extrabold font-display leading-none text-white">
            {" "}
            CLUB
          </span>
        </div>
      </div>

      {/* Wallet */}
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        data-ocid="header.button"
        style={flashStyle}
      >
        <div className="w-6 h-6 rounded-full gradient-cta flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {profile.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-white/70 text-[10px] leading-none">Wallet</span>
          <span
            className="text-xs font-semibold leading-tight"
            style={{
              color:
                flashState === "win"
                  ? "oklch(0.85 0.22 145)"
                  : flashState === "loss"
                    ? "oklch(0.75 0.22 25)"
                    : "white",
              transition: "color 0.3s ease",
            }}
          >
            ₹{balance.toLocaleString()}
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/60" />
      </button>
    </header>
  );
}
