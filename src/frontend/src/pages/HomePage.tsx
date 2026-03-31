import { Button } from "@/components/ui/button";
import { Dices, Gift, Loader2, Lock, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useClaimDailyBonus, useProfile } from "../hooks/useQueries";

interface HomePageProps {
  onNavigateToWingo: () => void;
}

const GAME_CARDS = [
  {
    id: "wingo",
    name: "Win Go",
    subtitle: "Color Prediction",
    gradient:
      "linear-gradient(135deg, oklch(var(--game-purple)), oklch(var(--game-blue)))",
    iconColor: "oklch(var(--game-cyan))",
    active: true,
    rounds: "1min",
  },
  {
    id: "k3",
    name: "K3",
    subtitle: "Lottery",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.18 55), oklch(0.55 0.2 35))",
    iconColor: "oklch(0.9 0.15 80)",
    active: false,
    rounds: "3min",
  },
  {
    id: "5d",
    name: "5D Lottery",
    subtitle: "5-Digit",
    gradient:
      "linear-gradient(135deg, oklch(0.55 0.18 175), oklch(0.45 0.2 200))",
    iconColor: "oklch(0.85 0.15 175)",
    active: false,
    rounds: "5min",
  },
  {
    id: "trx",
    name: "TRX Win",
    subtitle: "TRX Hash",
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 15), oklch(0.45 0.22 5))",
    iconColor: "oklch(0.85 0.15 30)",
    active: false,
    rounds: "1min",
  },
];

export default function HomePage({ onNavigateToWingo }: HomePageProps) {
  const { data: profile } = useProfile();
  const claimBonus = useClaimDailyBonus();

  const balance = profile ? Number(profile.balance) : 0;

  const handleClaimBonus = async () => {
    try {
      await claimBonus.mutateAsync();
      toast.success("Daily bonus claimed! ₹100 added to your wallet 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim bonus");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Hero Banner */}
      <motion.div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.18 0.06 280), oklch(0.15 0.04 260))",
          minHeight: "180px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
          style={{ background: "oklch(var(--game-cyan))" }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10"
          style={{ background: "oklch(var(--game-purple))" }}
        />

        <div className="relative z-10 p-6 flex flex-col gap-4">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Total Balance
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-extrabold font-display text-white">
                ₹{balance.toLocaleString()}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-1">
              {profile?.username && `@${profile.username}`}
            </p>
          </div>

          <Button
            onClick={handleClaimBonus}
            disabled={claimBonus.isPending}
            data-ocid="home.primary_button"
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-full border-0 font-semibold text-sm"
            style={{
              background: "oklch(var(--game-cyan) / 0.2)",
              border: "1px solid oklch(var(--game-cyan) / 0.4)",
              color: "oklch(var(--game-cyan))",
            }}
          >
            {claimBonus.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            Claim Daily Bonus
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {[
          {
            label: "Total Bets",
            value: profile ? Number(profile.totalBets).toString() : "0",
          },
          {
            label: "Total Wins",
            value: profile ? Number(profile.totalWins).toString() : "0",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card-game rounded-xl p-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <p className="text-2xl font-bold font-display text-white">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Games Grid */}
      <div className="px-4">
        <h2 className="text-lg font-bold font-display text-white mb-3">
          Game Lobby
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {GAME_CARDS.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              data-ocid={`home.game.item.${i + 1}`}
            >
              <button
                type="button"
                onClick={() => game.active && onNavigateToWingo()}
                className="relative w-full overflow-hidden rounded-2xl transition-transform active:scale-95"
                style={{
                  background: game.gradient,
                  aspectRatio: "4/3",
                  cursor: game.active ? "pointer" : "default",
                }}
                disabled={!game.active}
              >
                {/* Coming Soon overlay */}
                {!game.active && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                    <Lock className="w-5 h-5 text-white/70 mb-1" />
                    <span className="text-white/80 text-xs font-semibold">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="relative p-4 h-full flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15">
                    {game.id === "wingo" ? (
                      <Zap
                        className="w-5 h-5"
                        style={{ color: game.iconColor }}
                      />
                    ) : (
                      <Dices
                        className="w-5 h-5"
                        style={{ color: game.iconColor }}
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-base leading-tight">
                      {game.name}
                    </p>
                    <p className="text-white/70 text-xs">{game.subtitle}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-black/20 text-white/80 text-[10px] font-medium">
                      {game.rounds}
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
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
