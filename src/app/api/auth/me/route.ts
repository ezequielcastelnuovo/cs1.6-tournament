import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("cs16_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: session.user,
      authenticated: true,
      token: session.token,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 200 }
    );
  }
}
