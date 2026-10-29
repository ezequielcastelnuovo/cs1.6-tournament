import { NextRequest, NextResponse } from "next/server";
import {
  getUserByUsername,
  createSession,
  hashPassword,
} from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || typeof username !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 }
      );
    }

    const user = await getUserByUsername(username.trim());
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
