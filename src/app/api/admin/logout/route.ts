import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { isSameOriginMutation } from "@/lib/request-security.mjs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  await deleteSession("admin");
  return NextResponse.json({ success: true });
}
