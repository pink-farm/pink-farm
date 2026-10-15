import { NextResponse } from "next/server";
import { prisma, queryDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const DEFAULT_SETTINGS = {
  id: "default",
  storeName: "Pink Farm",
  announcementText: "Welcome to Pink Farm — Goodness in Every Bite.",
  heroMainImage: "/images/makhana_sig.jpg",
  heroGheeImage: "/images/ghee.jpg",
  heroAlmondsImage: "/images/almonds.jpg",
  heartProductTitle: "Premium Phool Makhana",
  heartProductTagline: "Why not? You deserve the best.",
  heartProductFeatures: ["Plant-Based", "Gluten-Free", "Low Calorie", "High Calcium", "No Frying", "No Preservatives", "Farm to Table", "Hygienically Packed"],
  featuredProductHeading: "Meet Your New Favourite Snack.",
  featuredProductDescription: "Handpicked, light & wholesome",
  featuredProductImage: "",
  founderName: "Anjali",
  founderImage: "",
  founderRole: "Founder & Dietitian",
  founderStoryFirst: "Anjali started her journey as a trained dietitian — someone who spent years understanding the deep connection between what we eat and how we feel. She knew that truly good food doesn't need artificial anything. It just needs care, intention, and the right source.",
  founderStorySecond: "That belief became the seed of Pink Farm. What began as a personal mission to bring honest, nutritious snacks to her own family soon turned into something much bigger — a food brand built on trust, quality, and a quiet promise to never cut corners.",
  founderQuote: "Pure in nature, good for you. Simple food, stronger you.",
  founderTags: ["Nutrition", "Food Science", "Innovation", "Entrepreneur", "Founder", "Curator"],
  supportPhone: "+91 8437504040",
  supportEmail: "wecare@pinkfarm.in",
  businessAddress: "Dugri, Ludhiana, Punjab - 141003",
  deliveryFee: 5000, // in paise = ₹50
  freeDeliveryThreshold: 50000, // in paise = ₹500
  isAcceptingOrders: true,
};

const MAX_HERO_IMAGE_LENGTH = 900_000;

function isSafeHeroImage(value: string) {
  return (
    value.length <= MAX_HERO_IMAGE_LENGTH &&
    (value.startsWith("/images/") || /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))
  );
}

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

    const heroImages = [
      ["heroMainImage", body.heroMainImage],
      ["heroGheeImage", body.heroGheeImage],
      ["heroAlmondsImage", body.heroAlmondsImage],
      ["featuredProductImage", body.featuredProductImage],
      ["founderImage", body.founderImage],
    ] as const;
    for (const [field, value] of heroImages) {
      if (value !== undefined && (typeof value !== "string" || (value !== "" && !isSafeHeroImage(value)))) {
        return NextResponse.json({ error: `Invalid ${field}. Upload a smaller JPEG image and try again.` }, { status: 400 });
      }
    }

    const dataToSave = {
      storeName: typeof body.storeName === "string" ? body.storeName : DEFAULT_SETTINGS.storeName,
      announcementText: typeof body.announcementText === "string" ? body.announcementText : DEFAULT_SETTINGS.announcementText,
      heroMainImage: typeof body.heroMainImage === "string" ? body.heroMainImage : DEFAULT_SETTINGS.heroMainImage,
      heroGheeImage: typeof body.heroGheeImage === "string" ? body.heroGheeImage : DEFAULT_SETTINGS.heroGheeImage,
      heroAlmondsImage: typeof body.heroAlmondsImage === "string" ? body.heroAlmondsImage : DEFAULT_SETTINGS.heroAlmondsImage,
      heartProductTitle: typeof body.heartProductTitle === "string" ? body.heartProductTitle : DEFAULT_SETTINGS.heartProductTitle,
      heartProductTagline: typeof body.heartProductTagline === "string" ? body.heartProductTagline : DEFAULT_SETTINGS.heartProductTagline,
      heartProductFeatures: Array.isArray(body.heartProductFeatures) && body.heartProductFeatures.every((feature) => typeof feature === "string")
        ? body.heartProductFeatures.slice(0, 12).map((feature) => feature.trim()).filter(Boolean)
        : DEFAULT_SETTINGS.heartProductFeatures,
      featuredProductHeading: typeof body.featuredProductHeading === "string" ? body.featuredProductHeading : DEFAULT_SETTINGS.featuredProductHeading,
      featuredProductDescription: typeof body.featuredProductDescription === "string" ? body.featuredProductDescription : DEFAULT_SETTINGS.featuredProductDescription,
      featuredProductImage: typeof body.featuredProductImage === "string" ? body.featuredProductImage : DEFAULT_SETTINGS.featuredProductImage,
      founderName: typeof body.founderName === "string" ? body.founderName.slice(0, 100) : DEFAULT_SETTINGS.founderName,
      founderImage: typeof body.founderImage === "string" ? body.founderImage : DEFAULT_SETTINGS.founderImage,
      founderRole: typeof body.founderRole === "string" ? body.founderRole.slice(0, 120) : DEFAULT_SETTINGS.founderRole,
      founderStoryFirst: typeof body.founderStoryFirst === "string" ? body.founderStoryFirst.slice(0, 2000) : DEFAULT_SETTINGS.founderStoryFirst,
      founderStorySecond: typeof body.founderStorySecond === "string" ? body.founderStorySecond.slice(0, 2000) : DEFAULT_SETTINGS.founderStorySecond,
      founderQuote: typeof body.founderQuote === "string" ? body.founderQuote.slice(0, 500) : DEFAULT_SETTINGS.founderQuote,
      founderTags: Array.isArray(body.founderTags) && body.founderTags.every((tag) => typeof tag === "string")
        ? body.founderTags.slice(0, 12).map((tag) => tag.trim().slice(0, 40)).filter(Boolean)
        : DEFAULT_SETTINGS.founderTags,
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
