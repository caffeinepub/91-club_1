import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Bet, Period } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useCurrentPeriod,
  useGameHistory,
  usePlaceBet,
} from "../hooks/useQueries";

const MULTIPLIER_VALUES = [1, 5, 10, 20, 50];
const STAKE_OPTIONS = [10, 50, 100, 500];

function getNumberColor(n: number): "Green" | "Red" | "Violet" {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function NumberBadge({
  num,
  size = "md",
}: { num: number; size?: "sm" | "md" | "lg" }) {
  const color = getNumberColor(num);
  const colorClass =
    color === "Violet"
      ? "badge-violet"
      : color === "Green"
        ? "badge-green"
        : "badge-red";
  const sizeClass =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
        ? "w-16 h-16 text-3xl"
        : "w-9 h-9 text-sm";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl font-bold text-white ${colorClass} ${sizeClass}`}
    >
      {num}
    </span>
  );
}

function HistoryRow({ period, index }: { period: Period; index: number }) {
  const resultNum = Number(period.result);
  const color = getNumberColor(resultNum);
  const colorLabel = color;
  const borderColor =
    color === "Green"
      ? "oklch(var(--game-green) / 0.4)"
      : color === "Red"
        ? "oklch(var(--game-red) / 0.4)"
        : "oklch(var(--game-violet) / 0.4)";

  return (
    <motion.div
      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
      style={{
        background: "oklch(var(--game-surface-2))",
        border: `1px solid ${borderColor}`,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`history.item.${index}`}
    >
      <span className="text-muted-foreground text-xs font-medium w-20 truncate">
        #{period.id.toString()}
      </span>
      <div className="flex items-center gap-2">
        <NumberBadge num={resultNum} size="sm" />
        <span
          className="text-xs font-medium"
          style={{
            color:
              color === "Green"
                ? "oklch(var(--game-green))"
                : color === "Red"
                  ? "oklch(var(--game-red))"
                  : "oklch(var(--game-violet))",
          }}
        >
          {colorLabel}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">
        {period.status === "closed" ? "Closed" : "Open"}
      </span>
    </motion.div>
  );
}

interface RoundResult {
  number: number;
  color: string;
  userWon: boolean | null;
  amount: number;
}

interface PendingBetInfo {
  betType: string;
  betValue: string;
  stakeAmount: number;
  multiplier: number;
}

function computeResult(
  resultNum: number,
  pending: PendingBetInfo,
): { won: boolean; payout: number } {
  const resultColor = getNumberColor(resultNum);
  let won = false;
  if (pending.betType === "number") {
    won = resultNum.toString() === pending.betValue;
  } else if (pending.betType === "color") {
    won = resultColor === pending.betValue;
  }
  if (won) {
    const colorMultiplier = pending.betValue === "Violet" ? 9 : 2;
    return {
      won: true,
      payout: pending.stakeAmount * pending.multiplier * colorMultiplier,
    };
  }
  return { won: false, payout: pending.stakeAmount };
}

export default function WinGoPage() {
  const [selectedBetType, setSelectedBetType] = useState<
    "color" | "number" | null
  >(null);
  const [selectedBetValue, setSelectedBetValue] = useState<string | null>(null);
  const [selectedStake, setSelectedStake] = useState<number>(100);
  const [multiplierIndex, setMultiplierIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(60);
  const [betDialogOpen, setBetDialogOpen] = useState<boolean>(false);
  const [activePeriodId, setActivePeriodId] = useState<bigint | null>(null);
  const [pendingBetInfo, setPendingBetInfo] = useState<PendingBetInfo | null>(
    null,
  );
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showResultOverlay, setShowResultOverlay] = useState<boolean>(false);

  const { actor } = useActor();
  const queryClient = useQueryClient();
  const placeBetMutation = usePlaceBet();
  const { data: currentPeriod, isLoading: periodLoading } = useCurrentPeriod();
  const { data: gameHistory, isLoading: historyLoading } = useGameHistory();

  const currentMultiplier = MULTIPLIER_VALUES[multiplierIndex];

  const finalizeCallback = useCallback(async () => {
    if (!actor) return;
    const closedPeriodId = activePeriodId;
    const closedBetInfo = pendingBetInfo;
    try {
      await actor.finalizePeriod();
    } catch {
      // silently ignore - may already be finalized
    }

    // Fetch updated data in parallel
    const [, bets] = await Promise.all([
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["currentPeriod"] }),
        queryClient.invalidateQueries({ queryKey: ["gameHistory"] }),
        queryClient.invalidateQueries({ queryKey: ["balance"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]),
      actor.getMyBets().catch((): Bet[] => []),
    ]);

    // Try to find result from game history
    let resultNum: number | null = null;
    if (closedPeriodId !== null) {
      const matchingBet = bets.find((b) => b.periodId === closedPeriodId);
      if (matchingBet) {
        // We can determine the result from game history via queryClient cache
        const history = queryClient.getQueryData<Period[]>(["gameHistory"]);
        const matchingPeriod = history?.find((p) => p.id === closedPeriodId);
        if (matchingPeriod) {
          resultNum = Number(matchingPeriod.result);
        }
      }
    }

    // Fallback: get result from history directly
    if (resultNum === null) {
      const history = queryClient.getQueryData<Period[]>(["gameHistory"]);
      if (history && history.length > 0) {
        // Most recent closed period
        const sorted = [...history].sort((a, b) => Number(b.id) - Number(a.id));
        const closed = sorted.find((p) => p.status === "closed");
        if (closed) resultNum = Number(closed.result);
      }
    }

    if (resultNum !== null) {
      const resultColor = getNumberColor(resultNum);
      if (closedBetInfo) {
        const { won, payout } = computeResult(resultNum, closedBetInfo);
        const result: RoundResult = {
          number: resultNum,
          color: resultColor,
          userWon: won,
          amount: payout,
        };
        setRoundResult(result);
        setShowResultOverlay(true);
        setPendingBetInfo(null);
        setActivePeriodId(null);
        if (won) {
          toast.success(`🎉 You won ₹${payout.toLocaleString()}!`);
        } else {
          toast.error(
            `💸 You lost ₹${closedBetInfo.stakeAmount.toLocaleString()}`,
          );
        }
      } else {
        setRoundResult({
          number: resultNum,
          color: resultColor,
          userWon: null,
          amount: 0,
        });
        setShowResultOverlay(true);
      }
    }
  }, [actor, queryClient, activePeriodId, pendingBetInfo]);

  const finalizeRef = useRef(finalizeCallback);
  finalizeRef.current = finalizeCallback;

  // Auto-hide overlay after 3 seconds
  useEffect(() => {
    if (showResultOverlay) {
      const t = setTimeout(() => setShowResultOverlay(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showResultOverlay]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          finalizeRef.current();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleColorSelect = (color: string) => {
    setSelectedBetType("color");
    setSelectedBetValue(color);
  };

  const handleNumberSelect = (num: number) => {
    setSelectedBetType("number");
    setSelectedBetValue(num.toString());
  };

  const handlePlaceBet = () => {
    if (!selectedBetValue) {
      toast.error("Please select a bet first");
      return;
    }
    setBetDialogOpen(true);
  };

  const confirmBet = async () => {
    if (!selectedBetType || !selectedBetValue) return;
    try {
      await placeBetMutation.mutateAsync({
        betType: selectedBetType,
        betValue: selectedBetValue,
        stakeAmount: selectedStake,
        multiplier: currentMultiplier,
      });
      // Store bet info and period for result tracking
      if (currentPeriod) {
        setActivePeriodId(currentPeriod[0]);
      }
      setPendingBetInfo({
        betType: selectedBetType,
        betValue: selectedBetValue,
        stakeAmount: selectedStake,
        multiplier: currentMultiplier,
      });
      toast.success(
        `Bet placed! ₹${selectedStake} on ${selectedBetValue} ×${currentMultiplier}`,
      );
      setSelectedBetType(null);
      setSelectedBetValue(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place bet");
    } finally {
      setBetDialogOpen(false);
    }
  };

  const colorOptions = [
    {
      value: "Green",
      label: "Green",
      multiplier: "2x",
      cls: "pill-green",
      activeCls: "pill-active-green",
    },
    {
      value: "Violet",
      label: "Violet",
      multiplier: "9x",
      cls: "pill-violet",
      activeCls: "pill-active-violet",
    },
    {
      value: "Red",
      label: "Red",
      multiplier: "2x",
      cls: "pill-red",
      activeCls: "pill-active-red",
    },
  ];

  const isBetSelected = selectedBetType !== null && selectedBetValue !== null;
  const isColorBet = selectedBetType === "color";

  const betLabel = isBetSelected
    ? isColorBet
      ? `Color: ${selectedBetValue}`
      : `Number: ${selectedBetValue} (${getNumberColor(Number(selectedBetValue))})`
    : "Select a bet to continue";

  const potentialWin = isBetSelected
    ? selectedStake *
      currentMultiplier *
      (isColorBet && selectedBetValue === "Violet" ? 9 : 2)
    : 0;

  return (
    <div className="flex flex-col gap-3 pb-6 px-4 pt-3">
      {/* Main WinGo Card */}
      <motion.div
        className="card-neon rounded-2xl overflow-hidden relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Round Result Overlay */}
        <AnimatePresence>
          {showResultOverlay && roundResult && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.75)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              data-ocid="wingo.result.modal"
            >
              <motion.div
                className="flex flex-col items-center gap-4 rounded-2xl px-8 py-6 mx-4"
                style={{
                  background: "oklch(var(--game-surface))",
                  border:
                    roundResult.userWon === true
                      ? "1.5px solid oklch(var(--game-green) / 0.6)"
                      : roundResult.userWon === false
                        ? "1.5px solid oklch(var(--game-red) / 0.6)"
                        : "1.5px solid oklch(var(--game-divider))",
                  boxShadow:
                    roundResult.userWon === true
                      ? "0 0 32px oklch(var(--game-green) / 0.25)"
                      : roundResult.userWon === false
                        ? "0 0 32px oklch(var(--game-red) / 0.25)"
                        : "none",
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: "oklch(var(--game-cyan))" }}
                >
                  Round Result
                </p>

                <NumberBadge num={roundResult.number} size="lg" />

                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      roundResult.color === "Green"
                        ? "oklch(var(--game-green))"
                        : roundResult.color === "Red"
                          ? "oklch(var(--game-red))"
                          : "oklch(var(--game-violet))",
                  }}
                >
                  {roundResult.color}
                </p>

                {roundResult.userWon === true && (
                  <motion.p
                    className="text-xl font-extrabold font-display"
                    style={{ color: "oklch(var(--game-green))" }}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    🎉 YOU WIN! +₹{roundResult.amount.toLocaleString()}
                  </motion.p>
                )}
                {roundResult.userWon === false && (
                  <motion.p
                    className="text-xl font-extrabold font-display"
                    style={{ color: "oklch(var(--game-red))" }}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    💸 YOU LOSE -₹{roundResult.amount.toLocaleString()}
                  </motion.p>
                )}
                {roundResult.userWon === null && (
                  <p className="text-sm text-muted-foreground">
                    No bets this round
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Header */}
        <div
          className="px-4 pt-4 pb-3"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.22 0.04 270 / 0.5) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-extrabold font-display text-white">
                Win Go
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                NEXT DRAW IN:
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.15, color: "oklch(var(--game-cyan))" }}
                  animate={{ scale: 1, color: "white" }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl font-extrabold font-display mt-1"
                  style={{ lineHeight: 1.1 }}
                >
                  {formatTime(countdown)}
                </motion.div>
              </AnimatePresence>
              {/* Progress bar */}
              <div
                className="mt-2 h-1.5 rounded-full overflow-hidden"
                style={{ background: "oklch(var(--game-divider))" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    background:
                      countdown <= 10
                        ? "oklch(var(--game-red))"
                        : "linear-gradient(90deg, oklch(var(--game-cyan)), oklch(var(--game-purple)))",
                    width: `${(countdown / 60) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Period info */}
            <div className="text-right ml-4">
              <p className="text-xs text-muted-foreground">Current Period</p>
              {periodLoading ? (
                <Skeleton className="h-4 w-20 mt-1" />
              ) : (
                <p
                  className="text-xs font-bold mt-1"
                  style={{ color: "oklch(var(--game-cyan))" }}
                >
                  #{currentPeriod?.[0]?.toString() ?? "--"}
                </p>
              )}
              <div
                className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  background: "oklch(var(--game-green) / 0.15)",
                  color: "oklch(var(--game-green))",
                  border: "1px solid oklch(var(--game-green) / 0.3)",
                }}
              >
                {currentPeriod?.[1] ?? "open"}
              </div>
            </div>
          </div>
        </div>

        <div
          className="h-px mx-4"
          style={{ background: "oklch(var(--game-divider))" }}
        />

        <div className="p-4 flex flex-col gap-4">
          {/* Select Color */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Select Color
            </p>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((opt) => {
                const isActive =
                  selectedBetType === "color" && selectedBetValue === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleColorSelect(opt.value)}
                    data-ocid={`wingo.color_${opt.value.toLowerCase()}.button`}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                      isActive ? opt.activeCls : opt.cls
                    }`}
                  >
                    <span className="block">{opt.label}</span>
                    <span className="text-xs opacity-80">{opt.multiplier}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Number */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Select Number
            </p>
            <div className="grid grid-cols-5 gap-2">
              {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((i) => {
                const color = getNumberColor(i);
                const isActive =
                  selectedBetType === "number" &&
                  selectedBetValue === i.toString();
                const baseClass =
                  color === "Violet"
                    ? "chip-number-violet"
                    : color === "Green"
                      ? "chip-number-green"
                      : "chip-number-red";

                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => handleNumberSelect(i)}
                    data-ocid={`wingo.number_${i}.button`}
                    className={`aspect-square rounded-xl font-bold text-lg flex items-center justify-center transition-all active:scale-90 ${baseClass}`}
                    style={{
                      boxShadow: isActive
                        ? "0 0 0 2px white, 0 0 8px rgba(255,255,255,0.4)"
                        : "none",
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake Amount */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Stake Amount
            </p>
            <div className="grid grid-cols-4 gap-2">
              {STAKE_OPTIONS.map((amount) => (
                <button
                  type="button"
                  key={`stake-${amount}`}
                  onClick={() => setSelectedStake(amount)}
                  data-ocid={`wingo.stake_${amount}.button`}
                  className={`py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                    selectedStake === amount
                      ? "stake-chip-active"
                      : "stake-chip"
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Multiplier
              </p>
              <span
                className="text-sm font-bold"
                style={{ color: "oklch(var(--game-cyan))" }}
              >
                ×{currentMultiplier}
              </span>
            </div>
            <Slider
              min={0}
              max={4}
              step={1}
              value={[multiplierIndex]}
              onValueChange={(v) => setMultiplierIndex(v[0])}
              className="w-full"
              data-ocid="wingo.multiplier.toggle"
            />
            <div className="flex justify-between mt-1.5">
              {MULTIPLIER_VALUES.map((v) => (
                <span
                  key={`mult-${v}`}
                  className="text-[10px] text-muted-foreground"
                >
                  ×{v}
                </span>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handlePlaceBet}
            disabled={!isBetSelected || placeBetMutation.isPending}
            data-ocid="wingo.place_bet.primary_button"
            className="w-full h-14 rounded-2xl font-bold text-white border-0 transition-all"
            style={{
              background: isBetSelected
                ? "linear-gradient(135deg, oklch(var(--game-blue)), oklch(var(--game-purple)))"
                : "oklch(var(--game-divider))",
              boxShadow: isBetSelected
                ? "0 4px 20px oklch(var(--game-blue) / 0.3)"
                : "none",
            }}
          >
            {placeBetMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing bet...
              </span>
            ) : (
              <span className="flex flex-col items-center">
                <span className="text-base">
                  {isBetSelected
                    ? `Place Bet (₹${selectedStake})`
                    : "Select a Bet"}
                </span>
                {isBetSelected && (
                  <span className="text-xs text-white/70">
                    {betLabel} | ×{currentMultiplier}
                  </span>
                )}
              </span>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Game History */}
      <motion.div
        className="card-game rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4"
              style={{ color: "oklch(var(--game-cyan))" }}
            />
            Game History
          </h3>
          <span className="text-xs text-muted-foreground">Win Go</span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-3 px-4 py-2 border-b border-border">
          {["Period", "Number (Color)", "Status"].map((h) => (
            <span key={h} className="text-xs text-muted-foreground font-medium">
              {h}
            </span>
          ))}
        </div>

        <div
          className="p-3 flex flex-col gap-2 max-h-[320px] overflow-y-auto scrollbar-hidden"
          data-ocid="history.list"
        >
          {historyLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: loading skeletons are stable
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))
          ) : !gameHistory || gameHistory.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="history.empty_state"
            >
              No game history yet
            </div>
          ) : (
            gameHistory
              .slice()
              .reverse()
              .slice(0, 20)
              .map((period, i) => (
                <HistoryRow
                  key={period.id.toString()}
                  period={period}
                  index={i + 1}
                />
              ))
          )}
        </div>
      </motion.div>

      {/* Bet Confirmation Dialog */}
      <AlertDialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <AlertDialogContent
          className="max-w-sm rounded-2xl border-border"
          style={{ background: "oklch(var(--game-surface))" }}
          data-ocid="bet.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-bold">
              Confirm Your Bet
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 mt-3">
                <div
                  className="rounded-xl p-4 flex flex-col gap-2"
                  style={{ background: "oklch(var(--game-surface-2))" }}
                >
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Bet</span>
                    <span className="text-white font-semibold text-sm">
                      {betLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Stake</span>
                    <span className="text-white font-semibold text-sm">
                      ₹{selectedStake}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Multiplier
                    </span>
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "oklch(var(--game-cyan))" }}
                    >
                      ×{currentMultiplier}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ background: "oklch(var(--game-divider))" }}
                  />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Potential Win
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: "oklch(var(--game-green))" }}
                    >
                      ₹{potentialWin.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel
              data-ocid="bet.cancel_button"
              className="flex-1 border-border text-muted-foreground"
              style={{ background: "oklch(var(--game-surface-2))" }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBet}
              disabled={placeBetMutation.isPending}
              data-ocid="bet.confirm_button"
              className="flex-1 border-0 font-bold text-white gradient-cta"
            >
              {placeBetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm Bet"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
