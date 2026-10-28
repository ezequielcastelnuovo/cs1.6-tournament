import { kv } from "@vercel/kv";
import type { TournamentState } from "./types";
import { INITIAL_STATE } from "./types";

const TOURNAMENT_KEY = "cs16-tournament-state";

// In-memory fallback for local development without Vercel KV configured
let inMemoryState: TournamentState = INITIAL_STATE;

export async function getTournamentState(): Promise<TournamentState> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return inMemoryState;
    }
    const state = await kv.get<TournamentState>(TOURNAMENT_KEY);
    return state || inMemoryState;
  } catch (error) {
    console.warn("KV GET error, using in-memory state:", error);
    return inMemoryState;
  }
}

export async function setTournamentState(
  state: TournamentState
): Promise<void> {
  inMemoryState = state;
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(TOURNAMENT_KEY, state);
    }
  } catch (error) {
    console.warn("KV SET error, preserved in memory:", error);
  }
}
