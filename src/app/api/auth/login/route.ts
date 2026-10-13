import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
    const password = typeof values.password === "string" ? values.password : "";
    if (!emailPattern.test(email) || !password) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer?.passwordHash || !(await bcrypt.compare(password, customer.passwordHash))) {
      return NextResponse.json(
        { error: "Email or password is incorrect. You can also sign in with an email code." },
        { status: 401 }
      );
    }

    await createSession(customer.id, "customer");
    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (error) {
    console.error("Customer password sign-in failed:", error);
    return NextResponse.json({ error: "Unable to sign in right now. Please try again." }, { status: 500 });
  }
}
