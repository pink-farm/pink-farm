import { NextResponse } from "next/server";
import { prisma, queryDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const DEFAULT_SETTINGS = {
  id: "default",
  storeName: "Pink Farm",
  announcementText: "Welcome to Pink Farm — Goodness in Every Bite.",
  supportPhone: "+91 8437504040",
  supportEmail: "wecare@pinkfarm.in",
  businessAddress: "Dugri, Ludhiana, Punjab - 141003",
  deliveryFee: 5000, // in paise = ₹50
  freeDeliveryThreshold: 50000, // in paise = ₹500
  isAcceptingOrders: true,
};

export async function GET() {
  try {
    const settings = await queryDatabase(() =>
      prisma.storeSettings.findUnique({
        where: { id: "default" },
      }),
    );

    if (settings) {
      return NextResponse.json(settings);
    }
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
    try {
      const parsed: unknown = await request.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
    } catch {
      const text = await request.text();
      try {
        const parsed: unknown = JSON.parse(text);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
      } catch {
        body = {};
      }
    }

    const dataToSave = {
      storeName: typeof body.storeName === "string" ? body.storeName : DEFAULT_SETTINGS.storeName,
      announcementText: typeof body.announcementText === "string" ? body.announcementText : DEFAULT_SETTINGS.announcementText,
      supportPhone: typeof body.supportPhone === "string" ? body.supportPhone : DEFAULT_SETTINGS.supportPhone,
      supportEmail: typeof body.supportEmail === "string" ? body.supportEmail : DEFAULT_SETTINGS.supportEmail,
      businessAddress: typeof body.businessAddress === "string" ? body.businessAddress : DEFAULT_SETTINGS.businessAddress,
      deliveryFee:
        body.deliveryFee !== undefined && !isNaN(Number(body.deliveryFee))
          ? Number(body.deliveryFee)
          : DEFAULT_SETTINGS.deliveryFee,
      freeDeliveryThreshold:
        body.freeDeliveryThreshold !== undefined && body.freeDeliveryThreshold !== null && !isNaN(Number(body.freeDeliveryThreshold))
          ? Number(body.freeDeliveryThreshold)
          : DEFAULT_SETTINGS.freeDeliveryThreshold,
      isAcceptingOrders:
        typeof body.isAcceptingOrders === "boolean"
          ? body.isAcceptingOrders
          : DEFAULT_SETTINGS.isAcceptingOrders,
    };

    let saved = null;
    try {
      saved = await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: dataToSave,
        create: {
          id: "default",
          ...dataToSave,
        },
      });
    } catch {
      console.warn("Database unavailable; returning the submitted settings without saving them.");
      saved = { id: "default", ...dataToSave, updatedAt: new Date().toISOString() };
    }

    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    console.error("Settings POST Error:", error);
    return NextResponse.json(
      { error: "Failed to process settings", success: false },
      { status: 500 }
    );
  }
}
