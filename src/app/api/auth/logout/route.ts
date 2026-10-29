import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("cs16_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const token = bearerToken || cookieToken;

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("cs16_session", "", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
