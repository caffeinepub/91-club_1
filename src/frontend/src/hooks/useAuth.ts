import { Ed25519KeyIdentity } from "@dfinity/identity";
import type { Identity } from "@icp-sdk/core/agent";
import {
  type PropsWithChildren,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "91club_auth_v1";

interface StoredAuth {
  identityJson: string;
}

export interface AuthContextType {
  identity?: Identity;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<Identity>;
  logout: () => void;
  clear: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export async function deriveIdentity(
  username: string,
  password: string,
): Promise<Ed25519KeyIdentity> {
  const input = `91club:${username.toLowerCase().trim()}:${password}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const seed = new Uint8Array(hashBuffer);
  return Ed25519KeyIdentity.generate(seed);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { identityJson } = JSON.parse(stored) as StoredAuth;
        const restoredIdentity = Ed25519KeyIdentity.fromJSON(identityJson);
        setIdentity(restoredIdentity);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<Identity> => {
      const derived = await deriveIdentity(username, password);
      const identityJson = JSON.stringify(derived.toJSON());
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ identityJson }));
      setIdentity(derived);
      return derived;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentity(undefined);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      identity,
      isInitializing,
      login,
      logout,
      clear: logout,
    }),
    [identity, isInitializing, login, logout],
  );

  return createElement(AuthContext.Provider, { value, children });
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
