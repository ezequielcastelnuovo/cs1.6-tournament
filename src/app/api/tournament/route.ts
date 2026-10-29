import { NextRequest, NextResponse } from "next/server";
import { getTournamentState, setTournamentState, getSession } from "@/lib/kv";
import type { TournamentState } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;
  const session = await getSession(token);
  return session?.user || null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para acceder al torneo." },
        { status: 401 }
      );
    }

    const state = await getTournamentState(user.id);
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
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para guardar datos del torneo." },
        { status: 401 }
      );
    }

    const state: TournamentState = await request.json();
    await setTournamentState(state, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/tournament error:", error);
    return NextResponse.json(
      { error: "Failed to save tournament state" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para reiniciar el torneo." },
        { status: 401 }
      );
    }

    const { INITIAL_STATE } = await import("@/lib/types");
    await setTournamentState(INITIAL_STATE, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tournament error:", error);
    return NextResponse.json(
      { error: "Failed to reset tournament" },
      { status: 500 }
    );
  }
}
