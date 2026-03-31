import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Period {
    id: bigint;
    startTime: bigint;
    status: string;
    result: bigint;
}
export interface Bet {
    id: bigint;
    multiplier: bigint;
    stakeAmount: bigint;
    user: Principal;
    betType: string;
    betValue: string;
    periodId: bigint;
    outcome: string;
    payout: bigint;
}
export interface UserProfile {
    principal: Principal;
    referralCode: string;
    username: string;
    balance: bigint;
    lastDailyBonus: bigint;
    totalBets: bigint;
    totalWins: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimDailyBonus(): Promise<void>;
    finalizePeriod(): Promise<void>;
    getBalance(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentPeriod(): Promise<[bigint, string]>;
    getGameHistory(): Promise<Array<Period>>;
    getMyBets(): Promise<Array<Bet>>;
    getProfile(): Promise<UserProfile>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeBet(betType: string, betValue: string, stakeAmount: bigint, multiplier: bigint): Promise<void>;
    register(username: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
