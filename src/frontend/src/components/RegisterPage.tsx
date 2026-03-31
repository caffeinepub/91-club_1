import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dices, Loader2, LogOut, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useRegister } from "../hooks/useQueries";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const registerMutation = useRegister();
  const { logout } = useAuth();

  const handleRegister = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Please enter a username");
      return;
    }
    if (trimmed.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (trimmed.length > 20) {
      toast.error("Username must be 20 characters or less");
      return;
    }
    try {
      await registerMutation.mutateAsync(trimmed);
      toast.success("Welcome to 91 Club! 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <div
      className="fixed inset-0 flex justify-center items-center"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.10 0.022 270) 0%, oklch(0.13 0.025 265) 50%, oklch(0.11 0.018 260) 100%)",
      }}
    >
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col items-center justify-center px-6 gap-8">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--game-purple)), oklch(var(--game-blue)))",
            }}
          >
            <Dices className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold font-display text-accent">
              91
            </span>
            <span className="text-4xl font-extrabold font-display text-white">
              CLUB
            </span>
          </div>
        </motion.div>

        <motion.div
          className="w-full card-neon rounded-2xl p-6 flex flex-col gap-5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-white font-display">
              Create Your Account
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a username to start playing
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="username-input"
              className="text-sm font-medium text-muted-foreground"
            >
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username-input"
                data-ocid="register.input"
                placeholder="Enter username (3-20 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                className="pl-9 h-12 bg-game-surface-2 border-border text-white placeholder:text-muted-foreground rounded-xl"
                maxLength={20}
              />
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={registerMutation.isPending || !username.trim()}
            data-ocid="register.submit_button"
            className="w-full h-12 rounded-xl text-base font-bold text-white gradient-cta hover:opacity-90 transition-opacity border-0"
          >
            {registerMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Start Playing"
            )}
          </Button>

          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Login
          </button>
        </motion.div>
      </div>
    </div>
  );
}
