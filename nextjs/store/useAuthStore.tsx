"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest, getErrorMessage } from "@/lib/api";
import {
  AUTH_EVENT,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
  updateStoredUser,
} from "@/lib/auth";
import type { AuthSession, LoginPayload, RegisterPayload, User } from "@/types/banking";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      setToken(getStoredToken());
      setUser(getStoredUser());
    }

    syncFromStorage();
    setIsReady(true);

    window.addEventListener(AUTH_EVENT, syncFromStorage);
    return () => window.removeEventListener(AUTH_EVENT, syncFromStorage);
  }, []);

  useEffect(() => {
    async function hydrateUser() {
      const activeToken = getStoredToken();

      if (!activeToken) {
        return;
      }

      try {
        const response = await apiRequest<User>("/user");
        updateStoredUser(response.data);
        setUser(response.data);
      } catch {
        clearStoredAuth();
      }
    }

    if (isReady && token && !user) {
      void hydrateUser();
    }
  }, [isReady, token, user]);

  async function login(payload: LoginPayload) {
    const response = await apiRequest<AuthSession>("/login", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresAuth: false,
    });

    storeAuthSession(response.data);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  async function register(payload: RegisterPayload) {
    const response = await apiRequest<AuthSession>("/register", {
      method: "POST",
      body: JSON.stringify({ ...payload, role: payload.role ?? "user" }),
      requiresAuth: false,
    });

    storeAuthSession(response.data);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  function logout() {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!getStoredToken()) {
      return null;
    }

    try {
      const response = await apiRequest<User>("/user");
      updateStoredUser(response.data);
      setUser(response.data);
      return response.data;
    } catch (error) {
      clearStoredAuth();
      throw new Error(getErrorMessage(error));
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isReady,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isReady, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthStore must be used within AuthProvider.");
  }

  return context;
}