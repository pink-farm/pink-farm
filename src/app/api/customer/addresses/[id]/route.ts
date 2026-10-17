import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const parsed = await readBoundedJson(request, 16_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Address data must be a JSON object." }, { status: 400 });
    const body = parsed.value as Record<string, unknown>;
    const customerId = String(session.userId);
    const current = await prisma.customerAddress.findFirst({ where: { id, customerId } });
    if (!current) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    if (body.isDefault === true) await prisma.customerAddress.updateMany({ where: { customerId }, data: { isDefault: false } });
    const data: Record<string, unknown> = {};
    for (const field of ["label", "fullName", "phone", "addressLine1", "addressLine2", "city", "state", "pinCode"] as const) {
      if (typeof body[field] === "string") data[field] = body[field].trim().slice(0, field === "addressLine1" || field === "addressLine2" ? 200 : 100);
    }
    if (typeof body.isDefault === "boolean") data.isDefault = body.isDefault;
    const address = await prisma.customerAddress.update({ where: { id }, data });
    return NextResponse.json({ success: true, address });
  } catch { return NextResponse.json({ error: "Could not update the address." }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const customerId = String(session.userId);
    const address = await prisma.customerAddress.findFirst({ where: { id, customerId } });
    if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    await prisma.customerAddress.delete({ where: { id } });
    if (address.isDefault) {
      const replacement = await prisma.customerAddress.findFirst({ where: { customerId }, orderBy: { createdAt: "asc" } });
      if (replacement) await prisma.customerAddress.update({ where: { id: replacement.id }, data: { isDefault: true } });
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Could not delete the address." }, { status: 400 }); }
}
