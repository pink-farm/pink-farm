import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

const validAddress = (body: Record<string, unknown>) =>
  typeof body.label === "string" && ["Home", "Work", "Other"].includes(body.label) &&
  typeof body.fullName === "string" && body.fullName.trim().length > 0 &&
  typeof body.phone === "string" && body.phone.trim().length > 0 &&
  typeof body.addressLine1 === "string" && body.addressLine1.trim().length > 0 &&
  typeof body.city === "string" && body.city.trim().length > 0 &&
  typeof body.state === "string" && body.state.trim().length > 0 &&
  typeof body.pinCode === "string" && /^[1-9]\d{5}$/.test(body.pinCode);

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 16_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Address data must be a JSON object." }, { status: 400 });
    const body = parsed.value as Record<string, unknown>;
    if (!validAddress(body)) return NextResponse.json({ error: "Complete all required address fields." }, { status: 400 });
    const customerId = String(session.userId);
    const count = await prisma.customerAddress.count({ where: { customerId } });
    const isDefault = count === 0 || body.isDefault === true;
    if (isDefault) await prisma.customerAddress.updateMany({ where: { customerId }, data: { isDefault: false } });
    const address = await prisma.customerAddress.create({ data: {
      customerId, label: body.label as string, fullName: (body.fullName as string).trim().slice(0, 100),
      phone: (body.phone as string).trim().slice(0, 20), addressLine1: (body.addressLine1 as string).trim().slice(0, 200),
      addressLine2: typeof body.addressLine2 === "string" ? body.addressLine2.trim().slice(0, 200) : null,
      city: (body.city as string).trim().slice(0, 100), state: (body.state as string).trim().slice(0, 100), pinCode: body.pinCode as string, isDefault,
    } });
    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not save the address." }, { status: 400 }); }
}
