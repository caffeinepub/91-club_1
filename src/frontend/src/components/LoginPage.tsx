import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActorWithConfig } from "../config";
import { deriveIdentity, useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const handleLogin = async () => {
    const trimmed = loginUsername.trim();
    if (!trimmed || !loginPassword) {
      toast.error("Please enter your username and password");
      return;
    }
    setIsLoading(true);
    try {
      const identity = await login(trimmed, loginPassword);
      const actor = await createActorWithConfig({ agentOptions: { identity } });
      await actor.getProfile();
      // Success — App.tsx profileQuery will refetch automatically
    } catch {
      toast.error("Invalid username or password");
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const trimmed = regUsername.trim();
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
    if (!regPassword) {
      toast.error("Please enter a password");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      // Derive identity WITHOUT committing the session yet
      const identity = await deriveIdentity(trimmed, regPassword);
      const actor = await createActorWithConfig({ agentOptions: { identity } });
      // Register on backend FIRST — only commit session after success
      await actor.register(trimmed);
      // Registration succeeded — now store the session
      await login(trimmed, regPassword);
      toast.success("Welcome to 91 Club! 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsLoading(false);
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
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col items-center justify-between px-6 py-10 overflow-y-auto">
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center gap-3 mt-8 mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--game-purple)), oklch(var(--game-blue)))",
              boxShadow: "0 0 32px oklch(var(--game-cyan) / 0.25)",
            }}
          >
            <Dices className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold font-display text-accent">
              91
            </span>
            <span className="text-5xl font-extrabold font-display text-white">
              CLUB
            </span>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            India's #1 Color Prediction Game
          </p>
        </motion.div>

        {/* Auth Tabs */}
        <motion.div
          className="w-full my-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList
              className="w-full h-12 rounded-xl mb-5"
              style={{ background: "oklch(0.16 0.022 268)" }}
            >
              <TabsTrigger
                value="login"
                data-ocid="auth.login.tab"
                className="flex-1 h-10 rounded-lg text-sm font-semibold"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                data-ocid="auth.register.tab"
                className="flex-1 h-10 rounded-lg text-sm font-semibold"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {/* ── Login Tab ── */}
            <TabsContent value="login" className="mt-0">
              <div className="card-neon rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">
                    Welcome Back
                  </h2>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Login to continue playing
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="login-username"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-username"
                      data-ocid="login.input"
                      placeholder="Enter username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="pl-9 h-12 bg-game-surface-2 border-border text-white placeholder:text-muted-foreground rounded-xl"
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="pl-9 pr-11 h-12 bg-game-surface-2 border-border text-white placeholder:text-muted-foreground rounded-xl"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={
                    isLoading || !loginUsername.trim() || !loginPassword
                  }
                  data-ocid="login.primary_button"
                  className="w-full h-12 rounded-xl text-base font-bold text-white gradient-cta hover:opacity-90 transition-opacity border-0 mt-1"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    "Login to Play"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* ── Register Tab ── */}
            <TabsContent value="register" className="mt-0">
              <div className="card-neon rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">
                    Create Account
                  </h2>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Join and start winning today
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="reg-username"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      data-ocid="register.input"
                      placeholder="Choose username (3–20 chars)"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                      className="pl-9 h-12 bg-game-surface-2 border-border text-white placeholder:text-muted-foreground rounded-xl"
                      maxLength={20}
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="reg-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Choose password (min 6 chars)"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                      className="pl-9 pr-11 h-12 bg-game-surface-2 border-border text-white placeholder:text-muted-foreground rounded-xl"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="reg-confirm"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showRegConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                      className="pl-9 pr-11 h-12 bg-game-surface-2 border-border text-white placeholder:text-muted-foreground rounded-xl"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showRegConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={
                    isLoading ||
                    !regUsername.trim() ||
                    !regPassword ||
                    !regConfirm
                  }
                  data-ocid="register.submit_button"
                  className="w-full h-12 rounded-xl text-base font-bold text-white gradient-cta hover:opacity-90 transition-opacity border-0 mt-1"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Start Playing"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
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
