import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, deleteSession } from "@/lib/auth";
import { isSameOriginMutation } from "@/lib/request-security.mjs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    await deleteSession("admin");
  } catch (err) {
    console.warn("security.admin_logout.error", err);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
