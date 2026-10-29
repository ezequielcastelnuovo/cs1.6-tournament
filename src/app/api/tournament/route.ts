import { NextRequest, NextResponse } from "next/server";
import { getTournamentState, setTournamentState } from "@/lib/kv";
import type { TournamentState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getTournamentState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/tournament error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament state" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const state: TournamentState = await request.json();
    await setTournamentState(state);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/tournament error:", error);
    return NextResponse.json(
      { error: "Failed to save tournament state" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { INITIAL_STATE } = await import("@/lib/types");
    await setTournamentState(INITIAL_STATE);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tournament error:", error);
    return NextResponse.json(
      { error: "Failed to reset tournament" },
      { status: 500 }
    );
  }
}
