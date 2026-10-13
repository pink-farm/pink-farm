import { NextResponse } from "next/server";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type OtpPurpose = "login" | "register";

const hashCode = (email: string, code: string) =>
  createHmac("sha256", process.env.SESSION_SECRET || process.env.ADMIN_JWT_SECRET || "")
    .update(`${email}:${code}`)
    .digest("hex");

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
    const name = typeof values.name === "string" ? values.name.trim().slice(0, 100) : "";
    const password = typeof values.password === "string" ? values.password : "";
    const code = typeof values.code === "string" ? values.code.trim() : "";
    const purpose: OtpPurpose = values.mode === "register" ? "register" : "login";

    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (!code) {
      let passwordHash: string | undefined;
      if (purpose === "register") {
        if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
        if (password.length < 8 || password.length > 128) {
          return NextResponse.json({ error: "Choose a password between 8 and 128 characters." }, { status: 400 });
        }
        if (await prisma.customer.findUnique({ where: { email }, select: { id: true } })) {
          return NextResponse.json({ error: "This email is already registered. Please sign in instead." }, { status: 409 });
        }
        passwordHash = await bcrypt.hash(password, 12);
      } else if (!(await prisma.customer.findUnique({ where: { email }, select: { id: true } }))) {
        return NextResponse.json({ error: "No account was found for this email. Register to create one." }, { status: 404 });
      }

      if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL) {
        return NextResponse.json({ error: "Email verification is not configured yet." }, { status: 503 });
      }

      const recent = await prisma.otpChallenge.findFirst({
        where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } },
        select: { id: true },
      });
      if (recent) {
        return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });
      }

      const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await prisma.otpChallenge.deleteMany({ where: { OR: [{ email }, { expiresAt: { lt: new Date() } }] } });
      await prisma.otpChallenge.create({
        data: {
          email,
          purpose,
          ...(purpose === "register" ? { customerName: name, passwordHash } : {}),
          codeHash: hashCode(email, otp),
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      });

      const isRegistration = purpose === "register";
      try {
        const delivery = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              email: process.env.BREVO_FROM_EMAIL,
              name: process.env.BREVO_FROM_NAME || "Pink Farm",
            },
            to: [{ email }],
            subject: isRegistration ? "Verify your Pink Farm account" : "Your Pink Farm sign-in code",
            textContent: `Your Pink Farm verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#20342c"><h2 style="color:#287447">Pink Farm verification</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
          }),
        });

        if (!delivery.ok) throw new Error(`Brevo returned status ${delivery.status}`);
      } catch (deliveryError) {
        await prisma.otpChallenge.deleteMany({ where: { email } });
        console.error("Brevo OTP delivery failed:", deliveryError);
        return NextResponse.json({ error: "We could not send your code. Please try again." }, { status: 502 });
      }

      return NextResponse.json({ success: true, message: "A verification code has been sent." });
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: { email, purpose },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }

    const expected = Buffer.from(challenge.codeHash, "hex");
    const actual = Buffer.from(hashCode(email, code), "hex");
    const valid = expected.length === actual.length && timingSafeEqual(expected, actual);
    if (!valid) {
      await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "That code is not correct." }, { status: 400 });
    }

    let customer;
    if (purpose === "register") {
      if (!challenge.customerName || !challenge.passwordHash) {
        return NextResponse.json({ error: "This registration code is no longer valid. Please start again." }, { status: 400 });
      }
      customer = await prisma.customer.create({
        data: { email, name: challenge.customerName, passwordHash: challenge.passwordHash },
      });
    } else {
      customer = await prisma.customer.findUnique({ where: { email } });
      if (!customer) return NextResponse.json({ error: "No account was found. Register to create one." }, { status: 404 });
    }

    await prisma.otpChallenge.deleteMany({ where: { email } });
    await createSession(customer.id, "customer");
    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (error) {
    console.error("Customer email verification failed:", error);
    return NextResponse.json({ error: "Unable to complete this request right now." }, { status: 500 });
  }
}
