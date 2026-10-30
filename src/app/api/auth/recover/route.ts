import { NextRequest, NextResponse } from "next/server";
import { createSession, getUserByUsername, saveUser } from "@/lib/kv";
import type { UserAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user: rawUser } = body;

    if (!rawUser || typeof rawUser !== "object" || !rawUser.username) {
      return NextResponse.json(
        { error: "Datos de usuario inválidos para recuperación" },
        { status: 400 }
      );
    }

    const cleanUsername = String(rawUser.username).trim();
    let existing = await getUserByUsername(cleanUsername);

    if (!existing) {
      const restored: UserAccount = {
        id: rawUser.id || `usr_${Date.now()}`,
        username: cleanUsername,
        displayName: rawUser.displayName || cleanUsername,
        passwordHash: rawUser.passwordHash || "recovered_session",
        role: rawUser.role || "player",
        avatarColor: rawUser.avatarColor || "#FF5500",
        createdAt: rawUser.createdAt || new Date().toISOString(),
      };
      await saveUser(restored);
      existing = restored;
    }

    const session = await createSession(existing);

    const response = NextResponse.json({
      success: true,
      user: session.user,
      token: session.token,
    });

    response.cookies.set("cs16_session", session.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/recover error:", error);
    return NextResponse.json(
      { error: "Error en recuperación de sesión" },
      { status: 500 }
    );
  }
}
