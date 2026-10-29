import { kv } from "@vercel/kv";
import type { TournamentState, UserAccount, UserSession } from "./types";
import { INITIAL_STATE } from "./types";

const TOURNAMENT_KEY = "cs16-tournament-state";
const USERS_KEY = "cs16-tournament-users";
const SESSIONS_KEY = "cs16-tournament-sessions";

const globalStore = globalThis as unknown as {
  cs16_tournamentState?: TournamentState;
  cs16_tournamentStates?: Record<string, TournamentState>;
  cs16_users?: Record<string, UserAccount>;
  cs16_sessions?: Record<string, UserSession>;
};

if (!globalStore.cs16_tournamentState) {
  globalStore.cs16_tournamentState = INITIAL_STATE;
}
if (!globalStore.cs16_tournamentStates) {
  globalStore.cs16_tournamentStates = {};
}
if (!globalStore.cs16_users) {
  globalStore.cs16_users = {};
}
if (!globalStore.cs16_sessions) {
  globalStore.cs16_sessions = {};
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + "_cs16_salt_uade");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getTournamentState(userId?: string): Promise<TournamentState> {
  const key = userId ? `${TOURNAMENT_KEY}:${userId}` : TOURNAMENT_KEY;

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      if (userId && globalStore.cs16_tournamentStates?.[userId]) {
        return globalStore.cs16_tournamentStates[userId];
      }
      return globalStore.cs16_tournamentState || INITIAL_STATE;
    }

    const state = await kv.get<TournamentState>(key);
    if (state) return state;

    if (userId && globalStore.cs16_tournamentStates?.[userId]) {
      return globalStore.cs16_tournamentStates[userId];
    }
    return globalStore.cs16_tournamentState || INITIAL_STATE;
  } catch (error) {
    console.warn("KV GET error, using in-memory state:", error);
    if (userId && globalStore.cs16_tournamentStates?.[userId]) {
      return globalStore.cs16_tournamentStates[userId];
    }
    return globalStore.cs16_tournamentState || INITIAL_STATE;
  }
}

export async function setTournamentState(
  state: TournamentState,
  userId?: string
): Promise<void> {
  const key = userId ? `${TOURNAMENT_KEY}:${userId}` : TOURNAMENT_KEY;

  if (!globalStore.cs16_tournamentStates) {
    globalStore.cs16_tournamentStates = {};
  }
  if (userId) {
    globalStore.cs16_tournamentStates[userId] = state;
  }
  globalStore.cs16_tournamentState = state;

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(key, state);
    }
  } catch (error) {
    console.warn("KV SET error, preserved in memory:", error);
  }
}

// User Accounts Management
export async function getAllUsers(): Promise<Record<string, UserAccount>> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return globalStore.cs16_users || {};
    }
    const users = await kv.get<Record<string, UserAccount>>(USERS_KEY);
    return users || globalStore.cs16_users || {};
  } catch (error) {
    console.warn("KV getAllUsers error, fallback in-memory:", error);
    return globalStore.cs16_users || {};
  }
}

export async function getUserByUsername(username: string): Promise<UserAccount | null> {
  const users = await getAllUsers();
  const key = username.trim().toLowerCase();
  return users[key] || null;
}

export async function saveUser(user: UserAccount): Promise<void> {
  const key = user.username.trim().toLowerCase();
  const users = await getAllUsers();
  users[key] = user;
  if (!globalStore.cs16_users) globalStore.cs16_users = {};
  globalStore.cs16_users[key] = user;

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(USERS_KEY, users);
    }
  } catch (error) {
    console.warn("KV saveUser error:", error);
  }
}

// Session Management
export async function getAllSessions(): Promise<Record<string, UserSession>> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return globalStore.cs16_sessions || {};
    }
    const sessions = await kv.get<Record<string, UserSession>>(SESSIONS_KEY);
    return sessions || globalStore.cs16_sessions || {};
  } catch (error) {
    console.warn("KV getAllSessions error:", error);
    return globalStore.cs16_sessions || {};
  }
}

export async function createSession(user: UserAccount): Promise<UserSession> {
  const token = generateToken();
  const session: UserSession = {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
    },
    // 30 days expiration
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  const sessions = await getAllSessions();
  sessions[token] = session;
  if (!globalStore.cs16_sessions) globalStore.cs16_sessions = {};
  globalStore.cs16_sessions[token] = session;

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(SESSIONS_KEY, sessions);
    }
  } catch (error) {
    console.warn("KV createSession error:", error);
  }

  return session;
}

export async function getSession(token: string): Promise<UserSession | null> {
  if (!token) return null;
  const sessions = await getAllSessions();
  const session = sessions[token];
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    deleteSession(token);
    return null;
  }

  return session;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await getAllSessions();
  delete sessions[token];
  if (globalStore.cs16_sessions) {
    delete globalStore.cs16_sessions[token];
  }

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(SESSIONS_KEY, sessions);
    }
  } catch (error) {
    console.warn("KV deleteSession error:", error);
  }
}


