import { Skeleton } from "@/components/ui/skeleton";
import { Clock, History, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { Bet } from "../backend.d";
import { useMyBets } from "../hooks/useQueries";

function getNumberColor(n: number): "Green" | "Red" | "Violet" {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

function BetBadge({ bet }: { bet: Bet }) {
  const isNumberBet = bet.betType === "number";
  const color = isNumberBet
    ? getNumberColor(Number(bet.betValue))
    : (bet.betValue as "Green" | "Red" | "Violet");

  const bgColor =
    color === "Green"
      ? "oklch(var(--game-green))"
      : color === "Red"
        ? "oklch(var(--game-red))"
        : "oklch(var(--game-violet))";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-white text-xs font-semibold"
      style={{ background: bgColor }}
    >
      {isNumberBet ? `#${bet.betValue}` : bet.betValue}
    </span>
  );
}

function BetRow({ bet, index }: { bet: Bet; index: number }) {
  const isWin = bet.outcome === "win";
  const isLose = bet.outcome === "lose";
  const isPending = bet.outcome === "pending";

  const borderColor = isWin
    ? "oklch(var(--game-green) / 0.4)"
    : isLose
      ? "oklch(var(--game-red) / 0.4)"
      : "oklch(var(--game-divider))";

  return (
    <motion.div
      className="card-game rounded-2xl p-4 flex flex-col gap-2.5"
      style={{ border: `1px solid ${borderColor}` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`bets.item.${index}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BetBadge bet={bet} />
          <span className="text-xs text-muted-foreground">
            {bet.betType === "color" ? "Color Bet" : "Number Bet"}
          </span>
        </div>
        <div>
          {isPending ? (
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "oklch(var(--game-cyan))" }}
            >
              <Clock className="w-3.5 h-3.5" /> Pending
            </span>
          ) : isWin ? (
            <span
              className="flex items-center gap-1 text-sm font-bold"
              style={{ color: "oklch(var(--game-green))" }}
            >
              <TrendingUp className="w-4 h-4" /> Won
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: "oklch(var(--game-red))" }}
            >
              <TrendingDown className="w-4 h-4" /> Lost
            </span>
          )}
        </div>
      </div>

      <div
        className="h-px"
        style={{ background: "oklch(var(--game-divider))" }}
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Stake</p>
          <p className="text-sm font-semibold text-white">
            ₹{Number(bet.stakeAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Multiplier</p>
          <p
            className="text-sm font-semibold"
            style={{ color: "oklch(var(--game-cyan))" }}
          >
            ×{Number(bet.multiplier)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payout</p>
          <p
            className="text-sm font-bold"
            style={{
              color: isWin
                ? "oklch(var(--game-green))"
                : "oklch(var(--muted-foreground))",
            }}
          >
            {isWin ? `₹${Number(bet.payout)}` : "-"}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Period #{bet.periodId.toString()}
      </p>
    </motion.div>
  );
}

export default function MyHistoryPage() {
  const { data: bets, isLoading } = useMyBets();

  const sortedBets = bets
    ? [...bets].sort((a, b) => Number(b.id) - Number(a.id))
    : [];

  const winCount = sortedBets.filter((b) => b.outcome === "win").length;
  const totalPayout = sortedBets.reduce(
    (sum, b) => sum + (b.outcome === "win" ? Number(b.payout) : 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.18 0.04 270 / 0.6) 0%, transparent 100%)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--game-purple)), oklch(var(--game-blue)))",
          }}
        >
          <History className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display text-white">My Bets</h1>
          <p className="text-xs text-muted-foreground">
            {sortedBets.length} bets placed
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && sortedBets.length > 0 && (
        <div className="px-4 grid grid-cols-2 gap-3">
          <div className="card-game rounded-xl p-3 text-center">
            <p
              className="text-2xl font-bold font-display"
              style={{ color: "oklch(var(--game-green))" }}
            >
              {winCount}
            </p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="card-game rounded-xl p-3 text-center">
            <p
              className="text-2xl font-bold font-display"
              style={{ color: "oklch(var(--game-cyan))" }}
            >
              ₹{totalPayout.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Won</p>
          </div>
        </div>
      )}

      {/* Bets List */}
      <div className="px-4 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton is stable
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : sortedBets.length === 0 ? (
          <motion.div
            className="card-game rounded-2xl p-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="bets.empty_state"
          >
            <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-semibold">No bets yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Head to WinGo to start playing!
            </p>
          </motion.div>
        ) : (
          sortedBets.map((bet, i) => (
            <BetRow key={bet.id.toString()} bet={bet} index={i + 1} />
          ))
        )}
      </div>
    </div>
  );
}
