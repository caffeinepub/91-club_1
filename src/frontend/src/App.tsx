import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { UserProfile } from "./backend.d";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { useActor } from "./hooks/useActor";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import MyHistoryPage from "./pages/MyHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import WinGoPage from "./pages/WinGoPage";

export type AppTab = "home" | "wingo" | "history" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const { identity, isInitializing } = useAuth();
  const { actor, isFetching: isActorFetching } = useActor();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const isAuthenticated = !!identity;

  const profileQuery = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getProfile();
    },
    enabled: !!actor && !isActorFetching && isAuthenticated,
    retry: false,
    staleTime: 30_000,
  });

  if (isInitializing || (isAuthenticated && isActorFetching)) {
    return (
      <>
        <LoadingScreen />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <>
        <LoadingScreen />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (!profileQuery.data) {
    return (
      <>
        <RegisterPage />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="flex justify-center min-h-dvh bg-background">
      <div className="relative w-full max-w-[480px] h-dvh flex flex-col overflow-hidden">
        <Header profile={profileQuery.data} />
        <main className="flex-1 overflow-y-auto scrollbar-hidden">
          {activeTab === "home" && (
            <HomePage onNavigateToWingo={() => setActiveTab("wingo")} />
          )}
          {activeTab === "wingo" && <WinGoPage />}
          {activeTab === "history" && <MyHistoryPage />}
          {activeTab === "profile" && (
            <ProfilePage
              profile={profileQuery.data}
              onTabChange={setActiveTab}
            />
          )}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.11 0.018 265), oklch(0.14 0.022 268))",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-5xl font-extrabold font-display text-accent">
          91
        </span>
        <span className="text-5xl font-extrabold font-display text-white">
          CLUB
        </span>
      </div>
      <p className="text-muted-foreground text-sm">
        India's #1 Color Prediction Game
      </p>
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: "oklch(var(--game-cyan))",
          borderTopColor: "transparent",
        }}
      />
    </div>
  );
}
