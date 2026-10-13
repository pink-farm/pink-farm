import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getCustomerSession((await cookies()).get("admin_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await prisma.customer.findUnique({
    where: { id: String(session.userId) },
    include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  let preferences: Record<string, unknown> = {};
  try { preferences = JSON.parse(customer.preferences); } catch { /* use defaults */ }
  let dietaryPreferences: string[] = [];
  try { dietaryPreferences = JSON.parse(customer.dietaryPreferences); } catch { /* use defaults */ }
  return NextResponse.json({
    profile: { name: customer.name, email: customer.email, phone: customer.phone || "", dob: customer.dob || "", gender: customer.gender || "", dietaryPreferences },
    addresses: customer.addresses,
    preferences,
  });
}

export async function PATCH(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const data: { name?: string; phone?: string; dob?: string; gender?: string; dietaryPreferences?: string; preferences?: string } = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 100);
    if (typeof body.phone === "string") data.phone = body.phone.replace(/[^\d+]/g, "").slice(0, 16);
    if (typeof body.dob === "string") data.dob = body.dob.slice(0, 10);
    if (typeof body.gender === "string") data.gender = body.gender.slice(0, 40);
    if (Array.isArray(body.dietaryPreferences) && body.dietaryPreferences.every((item: unknown) => typeof item === "string")) data.dietaryPreferences = JSON.stringify(body.dietaryPreferences.slice(0, 20));
    if (body.preferences && typeof body.preferences === "object") data.preferences = JSON.stringify({
      whatsappAlerts: Boolean(body.preferences.whatsappAlerts),
      smsUpdates: Boolean(body.preferences.smsUpdates),
      emailNewsletter: Boolean(body.preferences.emailNewsletter),
      preferredDeliverySlot: ["morning", "evening", "any"].includes(body.preferences.preferredDeliverySlot) ? body.preferences.preferredDeliverySlot : "any",
      deliveryNotes: typeof body.preferences.deliveryNotes === "string" ? body.preferences.deliveryNotes.slice(0, 500) : "",
    });
    const customer = await prisma.customer.update({ where: { id: String(session.userId) }, data });
    return NextResponse.json({ success: true, customer: { name: customer.name, email: customer.email, phone: customer.phone } });
  } catch {
    return NextResponse.json({ error: "Could not save your profile." }, { status: 400 });
  }
}
