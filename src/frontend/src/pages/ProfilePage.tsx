import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Dices, Gift, Loader2, LogOut, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { AppTab } from "../App";
import type { UserProfile } from "../backend.d";
import { useAuth } from "../hooks/useAuth";
import { useClaimDailyBonus } from "../hooks/useQueries";

interface ProfilePageProps {
  profile: UserProfile;
  onTabChange: (tab: AppTab) => void;
}

export default function ProfilePage({
  profile,
  onTabChange,
}: ProfilePageProps) {
  const { clear } = useAuth();
  const queryClient = useQueryClient();
  const claimBonus = useClaimDailyBonus();

  const balance = Number(profile.balance);
  const totalBets = Number(profile.totalBets);
  const totalWins = Number(profile.totalWins);
  const winRate = totalBets > 0 ? Math.round((totalWins / totalBets) * 100) : 0;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(profile.referralCode).then(() => {
      toast.success("Referral code copied!");
    });
  };

  const handleClaimBonus = async () => {
    try {
      await claimBonus.mutateAsync();
      toast.success("Daily bonus claimed! ₹100 added 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim bonus");
    }
  };

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Profile Header */}
      <motion.div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.22 0.06 285) 0%, oklch(0.16 0.04 265) 100%)",
          minHeight: "160px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
          style={{
            background: "oklch(var(--game-cyan))",
            transform: "translate(30%, -30%)",
          }}
        />

        <div className="relative z-10 p-6 flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold font-display text-white"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--game-purple)), oklch(var(--game-blue)))",
              boxShadow: "0 0 24px oklch(var(--game-purple) / 0.4)",
            }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold font-display text-white">
              @{profile.username}
            </h2>
            <p className="text-muted-foreground text-xs mt-1">
              {profile.principal.toString().slice(0, 16)}...
            </p>
          </div>

          <div
            className="px-6 py-3 rounded-2xl text-center"
            style={{ background: "oklch(0 0 0 / 0.2)" }}
          >
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className="text-3xl font-extrabold font-display text-white mt-1">
              ₹{balance.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Bets",
            value: totalBets.toString(),
            color: "oklch(var(--game-cyan))",
            icon: <Dices className="w-4 h-4" />,
          },
          {
            label: "Wins",
            value: totalWins.toString(),
            color: "oklch(var(--game-green))",
            icon: <Trophy className="w-4 h-4" />,
          },
          {
            label: "Win Rate",
            value: `${winRate}%`,
            color: "oklch(var(--game-violet))",
            icon: <Trophy className="w-4 h-4" />,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card-game rounded-xl p-3 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <p
              className="text-xl font-extrabold font-display"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 flex flex-col gap-3">
        {/* Referral Code */}
        <motion.div
          className="card-game rounded-2xl p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground mb-2">
            Your Referral Code
          </p>
          <div className="flex items-center justify-between gap-3">
            <span
              className="font-mono text-lg font-bold tracking-widest"
              style={{ color: "oklch(var(--game-cyan))" }}
            >
              {profile.referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopyReferral}
              data-ocid="profile.referral.button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-game-surface-2"
              style={{
                border: "1px solid oklch(var(--game-divider))",
                color: "oklch(var(--muted-foreground))",
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        </motion.div>

        {/* Daily Bonus */}
        <motion.button
          type="button"
          onClick={handleClaimBonus}
          disabled={claimBonus.isPending}
          data-ocid="profile.bonus.button"
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-98"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--game-green) / 0.15), oklch(var(--game-cyan) / 0.1))",
            border: "1px solid oklch(var(--game-green) / 0.3)",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(var(--game-green) / 0.2)" }}
            >
              <Gift
                className="w-5 h-5"
                style={{ color: "oklch(var(--game-green))" }}
              />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">Daily Bonus</p>
              <p className="text-xs text-muted-foreground">
                Claim ₹100 free daily
              </p>
            </div>
          </div>
          {claimBonus.isPending ? (
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "oklch(var(--game-green))" }}
            />
          ) : (
            <span
              className="text-sm font-bold"
              style={{ color: "oklch(var(--game-green))" }}
            >
              Claim
            </span>
          )}
        </motion.button>

        {/* Play WinGo */}
        <motion.button
          type="button"
          onClick={() => onTabChange("wingo")}
          data-ocid="profile.play.button"
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-98 gradient-cta"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15">
              <Dices className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white">Play WinGo</p>
          </div>
          <span className="text-white/70 text-sm">Go →</span>
        </motion.button>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            variant="destructive"
            onClick={handleLogout}
            data-ocid="profile.logout.button"
            className="w-full h-12 rounded-2xl font-bold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-4 pt-2">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
