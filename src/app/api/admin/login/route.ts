import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_EMAIL, createSession } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Only the authorized Pink Farm administrator can sign in here." }, { status: 403 });
    }
    const user = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await createSession(user.id, "admin");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
