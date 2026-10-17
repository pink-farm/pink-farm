import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

export async function GET() {
  const session = await getCustomerSession();
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
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 16_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Profile data must be a JSON object." }, { status: 400 });
    const body = parsed.value as Record<string, unknown>;
    const data: { name?: string; phone?: string; dob?: string; gender?: string; dietaryPreferences?: string; preferences?: string } = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 100);
    if (typeof body.phone === "string") data.phone = body.phone.replace(/[^\d+]/g, "").slice(0, 16);
    if (typeof body.dob === "string") data.dob = body.dob.slice(0, 10);
    if (typeof body.gender === "string") data.gender = body.gender.slice(0, 40);
    if (Array.isArray(body.dietaryPreferences) && body.dietaryPreferences.every((item: unknown) => typeof item === "string")) data.dietaryPreferences = JSON.stringify(body.dietaryPreferences.slice(0, 20));
    if (body.preferences && typeof body.preferences === "object" && !Array.isArray(body.preferences)) {
      const preferences = body.preferences as Record<string, unknown>;
      data.preferences = JSON.stringify({
        whatsappAlerts: Boolean(preferences.whatsappAlerts),
        smsUpdates: Boolean(preferences.smsUpdates),
        emailNewsletter: Boolean(preferences.emailNewsletter),
        preferredDeliverySlot: ["morning", "evening", "any"].includes(String(preferences.preferredDeliverySlot)) ? preferences.preferredDeliverySlot : "any",
        deliveryNotes: typeof preferences.deliveryNotes === "string" ? preferences.deliveryNotes.slice(0, 500) : "",
      });
    }
    const customer = await prisma.customer.update({ where: { id: String(session.userId) }, data });
    return NextResponse.json({ success: true, customer: { name: customer.name, email: customer.email, phone: customer.phone } });
  } catch {
    return NextResponse.json({ error: "Could not save your profile." }, { status: 400 });
  }
}
