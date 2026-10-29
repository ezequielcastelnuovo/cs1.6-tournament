import { NextRequest, NextResponse } from "next/server";
import {
  getUserByUsername,
  saveUser,
  createSession,
  hashPassword,
} from "@/lib/kv";
import type { UserAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#FF5500", // FaceIT Orange
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#EF4444", // Red
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, displayName, avatarColor } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "El nombre de usuario es requerido" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: "El usuario debe tener entre 3 y 20 caracteres" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "El usuario solo puede contener letras, números, guiones y puntos" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json(
        { error: `El usuario "${cleanUsername}" ya está registrado` },
        { status: 409 }
      );
    }

    const cleanDisplayName =
      typeof displayName === "string" && displayName.trim().length > 0
        ? displayName.trim().slice(0, 25)
        : cleanUsername;

    const chosenColor =
      typeof avatarColor === "string" && avatarColor.startsWith("#")
        ? avatarColor
        : AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const passwordHash = await hashPassword(password);

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      displayName: cleanDisplayName,
      passwordHash,
      role: "player",
      avatarColor: chosenColor,
      createdAt: new Date().toISOString(),
    };

    await saveUser(newUser);
    const session = await createSession(newUser);

    const response = NextResponse.json({
      success: true,
      user: session.user,
      token: session.token,
      accountBackup: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        passwordHash: newUser.passwordHash,
        avatarColor: newUser.avatarColor,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });

    response.cookies.set("cs16_session", session.token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Error interno al crear la cuenta" },
      { status: 500 }
    );
  }
}
