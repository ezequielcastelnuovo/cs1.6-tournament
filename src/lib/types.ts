export interface Match {
  id: string;
  round: number;
  position: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  isBye?: boolean;
  nextMatchId?: string | null;
  nextMatchSlot?: "player1" | "player2" | null;
}

export interface TournamentState {
  participants: string[];
  matches: Match[];
  rounds: number;
  generated: boolean;
  champion: string | null;
  leaderboard?: Record<string, { kills: number; deaths: number }>;
}

export const INITIAL_STATE: TournamentState = {
  participants: [],
  matches: [],
  rounds: 0,
  generated: false,
  champion: null,
  leaderboard: {},
};

// Generates a tournament bracket with 100% real matches
// All pairs are shuffled randomly.
// If the participant count in Round 0 is odd, the 1 odd participant sits at the BOTTOM
// of Round 0 with an explicit "Avanza por falta de rival" card and connects directly to their next match.
// If in later rounds a competitor has no rival in that round, they advance directly to the next round without dummy cards.
export function generateBracket(
  participants: string[],
  existingLeaderboard?: Record<string, { kills: number; deaths: number }>
): TournamentState {
  const n = participants.length;
  if (n < 2) {
    return { ...INITIAL_STATE, participants };
  }

  // Shuffle players randomly
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  let currentIncoming: {
    type: "player" | "winner_of";
    name?: string;
    sourceMatchId?: string | null;
  }[] = shuffled.map((p) => ({
    type: "player",
    name: p,
    sourceMatchId: null,
  }));

  const matches: Match[] = [];
  let roundIdx = 0;

  while (currentIncoming.length > 1) {
    const k = currentIncoming.length;
    const numMatches = Math.floor(k / 2);
    const hasOdd = k % 2 === 1;
    const nextIncoming: {
      type: "player" | "winner_of";
      name?: string;
      sourceMatchId?: string | null;
    }[] = [];

    // Regular matches
    for (let i = 0; i < numMatches; i++) {
      const inc1 = currentIncoming[i * 2];
      const inc2 = currentIncoming[i * 2 + 1];
      const matchId = `r${roundIdx}-m${i}`;

      const newMatch: Match = {
        id: matchId,
        round: roundIdx,
        position: i,
        player1: inc1.type === "player" ? inc1.name || null : null,
        player2: inc2.type === "player" ? inc2.name || null : null,
        winner: null,
        isBye: false,
        nextMatchId: null,
        nextMatchSlot: null,
      };

      // Connect upstream source matches
      if (inc1.sourceMatchId) {
        const sm = matches.find((m) => m.id === inc1.sourceMatchId);
        if (sm) {
          sm.nextMatchId = matchId;
          sm.nextMatchSlot = "player1";
          if (sm.winner) newMatch.player1 = sm.winner;
        }
      }
      if (inc2.sourceMatchId) {
        const sm = matches.find((m) => m.id === inc2.sourceMatchId);
        if (sm) {
          sm.nextMatchId = matchId;
          sm.nextMatchSlot = "player2";
          if (sm.winner) newMatch.player2 = sm.winner;
        }
      }

      matches.push(newMatch);
      nextIncoming.push({ type: "winner_of", sourceMatchId: matchId });
    }

    // Handle odd competitor
    if (hasOdd) {
      const oddInc = currentIncoming[k - 1];
      if (oddInc.type === "player") {
        // Player in round 0 sitting alone: create visual BYE card at bottom of round 0
        const byeMatchId = `r${roundIdx}-bye`;
        const playerName = oddInc.name || null;

        const byeMatch: Match = {
          id: byeMatchId,
          round: roundIdx,
          position: numMatches,
          player1: playerName,
          player2: null,
          winner: playerName,
          isBye: true,
          nextMatchId: null,
          nextMatchSlot: null,
        };

        matches.push(byeMatch);
        nextIncoming.push({
          type: "winner_of",
          sourceMatchId: byeMatchId,
          name: playerName || undefined,
        });
      } else {
        // Upstream match winner with no rival in this round:
        // Advances directly to the next round without any dummy bye card!
        nextIncoming.push(oddInc);
      }
    }

    currentIncoming = nextIncoming;
    roundIdx++;
  }

  return {
    participants,
    matches,
    rounds: roundIdx,
    generated: true,
    champion: null,
    leaderboard: existingLeaderboard || {},
  };
}

export function selectWinner(
  state: TournamentState,
  matchId: string,
  winner: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match) return state;

  match.winner = winner;

  // Send winner to next round match slot
  if (match.nextMatchId && match.nextMatchSlot) {
    const nextMatch = matches.find((m) => m.id === match.nextMatchId);
    if (nextMatch) {
      nextMatch[match.nextMatchSlot] = winner;
    }
  }

  // Champion is set upon winning the final round match
  const finalMatch = matches.find((m) => m.round === state.rounds - 1);
  const champion = finalMatch?.winner || null;

  return { ...state, matches, champion };
}

export function undoMatch(
  state: TournamentState,
  matchId: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match) return state;

  match.winner = null;

  // Recursively clear downstream slots
  function clearDownstream(targetMatch: Match) {
    if (targetMatch.nextMatchId && targetMatch.nextMatchSlot) {
      const next = matches.find((m) => m.id === targetMatch.nextMatchId);
      if (next) {
        next[targetMatch.nextMatchSlot] = null;
        if (next.winner) {
          next.winner = null;
          clearDownstream(next);
        }
      }
    }
  }

  clearDownstream(match);

  const finalMatch = matches.find((m) => m.round === state.rounds - 1);
  const champion = finalMatch?.winner || null;

  return { ...state, matches, champion };
}

// Clean CS maps with icon identifiers, preview images, and weapon mode rules
export const CS_MAPS = [
  { name: "aim_map", icon: "crosshair", label: "AIM", image: "/maps/aim_map.jpg", mode: "only rifle" },
  { name: "fy_iceworld2k", icon: "snowflake", label: "ICE", image: "/maps/fy_iceworld2k.jpg", mode: "all guns" },
  { name: "35hp_lava", icon: "flame", label: "LAVA", image: "/maps/35hp_lava.jpg", mode: "only knife" },
  { name: "aim_ak-colt", icon: "zap", label: "RIFLE", image: "/maps/aim_ak-colt.jpg", mode: "only rifle" },
  { name: "aim_headshot", icon: "target", label: "HEADSHOT", image: "/maps/aim_headshot.jpg", mode: "only rifle" },
  { name: "awp_india", icon: "shield", label: "SNIPER", image: "/maps/awp_india.jpg", mode: "only awp" },
  { name: "fy_pool_day", icon: "waves", label: "POOL", image: "/maps/fy_pool_day.jpg", mode: "all guns" },
] as const;
export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: "player" | "admin";
  avatarColor: string;
  createdAt: string;
}

export type UserPublicProfile = Omit<UserAccount, "passwordHash">;

export interface UserSession {
  token: string;
  user: UserPublicProfile;
  expiresAt: number;
}
