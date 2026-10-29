import { NextRequest, NextResponse } from "next/server";
import {
  getUserByUsername,
  saveUser,
  createSession,
  hashPassword,
} from "@/lib/kv";
import type { UserAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, backupAccount } = body;

    if (!username || typeof username !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    let user = await getUserByUsername(cleanUsername);

    // Si el servidor se reinició y la memoria RAM se limpió, auto-restaurar desde el backup validado
    if (!user && backupAccount && typeof backupAccount === "object") {
      if (
        backupAccount.username &&
        backupAccount.username.toLowerCase() === cleanUsername.toLowerCase() &&
        backupAccount.passwordHash
      ) {
        const checkHash = await hashPassword(password);
        if (checkHash === backupAccount.passwordHash) {
          const restored: UserAccount = {
            id: backupAccount.id || `usr_${Date.now()}`,
            username: cleanUsername,
            displayName: backupAccount.displayName || cleanUsername,
            passwordHash: checkHash,
            role: backupAccount.role || "player",
            avatarColor: backupAccount.avatarColor || "#FF5500",
            createdAt: backupAccount.createdAt || new Date().toISOString(),
          };
          await saveUser(restored);
          user = restored;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const incomingHash = await hashPassword(password);
    if (incomingHash !== user.passwordHash) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const session = await createSession(user);

    const response = NextResponse.json({
      success: true,
      user: session.user,
      token: session.token,
      accountBackup: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        passwordHash: user.passwordHash,
        avatarColor: user.avatarColor,
        role: user.role,
        createdAt: user.createdAt,
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
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Error interno al iniciar sesión" },
      { status: 500 }
    );
  }
}
