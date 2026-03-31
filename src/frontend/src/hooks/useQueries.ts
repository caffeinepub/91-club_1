import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bet, Period, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
    retry: false,
    staleTime: 30_000,
  });
}

export function useBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export function useCurrentPeriod() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, string]>({
    queryKey: ["currentPeriod"],
    queryFn: async () => {
      if (!actor) return [BigInt(0), "open"] as [bigint, string];
      return actor.getCurrentPeriod();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

export function useGameHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Period[]>({
    queryKey: ["gameHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGameHistory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useMyBets() {
  const { actor, isFetching } = useActor();
  return useQuery<Bet[]>({
    queryKey: ["myBets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyBets();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function usePlaceBet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      betType: string;
      betValue: string;
      stakeAmount: number;
      multiplier: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.placeBet(
        params.betType,
        params.betValue,
        BigInt(params.stakeAmount),
        BigInt(params.multiplier),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["myBets"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useClaimDailyBonus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.claimDailyBonus();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.register(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
