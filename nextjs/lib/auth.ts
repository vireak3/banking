import type { AuthSession, User } from "@/types/banking";

const TOKEN_KEY = "blueledger.token";
const USER_KEY = "blueledger.user";
const AUTH_COOKIE = "blueledger_token";
export const AUTH_EVENT = "blueledger:auth-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function syncCookie(token: string | null) {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  if (token) {
    document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
    return;
  }

  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function emitAuthChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getStoredToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (!isBrowser()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeAuthSession(session: AuthSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  syncCookie(session.token);
  emitAuthChange();
}

export function updateStoredUser(user: User) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function clearStoredAuth() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  syncCookie(null);
  emitAuthChange();
}