import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, queryDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

const DEFAULT_SETTINGS = {
  id: "default",
  storeName: "Pink Farm",
  announcementText: "Welcome to Pink Farm — Goodness in Every Bite.",
  heroMainImage: "/images/makhana_sig.jpg",
  heroGheeImage: "/images/ghee.jpg",
  heroAlmondsImage: "/images/almonds.jpg",
  heartProductId: "",
  heartProductTitle: "Premium Phool Makhana",
  heartProductTagline: "Why not? You deserve the best.",
  heartProductFeatures: ["Plant-Based", "Gluten-Free", "Low Calorie", "High Calcium", "No Frying", "No Preservatives", "Farm to Table", "Hygienically Packed"],
  heartProductButtonText: "Shop Now",
  heartProductButtonUrl: "",
  heartProductSubtitle: "Our Heart Product",
  heartProductImage: "",
  featuredProductId: "",
  featuredProductHeading: "Meet Your New Favourite Snack.",
  featuredProductDescription: "Handpicked, light & wholesome",
  featuredProductImage: "",
  featuredProductButtonText: "View Details & Add to Cart",
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
  fssaiNumber: "22126026000144",
  deliveryFee: 5000, // in paise = ₹50
  freeDeliveryThreshold: 50000, // in paise = ₹500
  isAcceptingOrders: true,
  comboEnabled: true,
  comboEyebrow: "Make Your Own Combo",
  comboTitlePrefix: "Curate Your",
  comboTitleHighlight: "Pink Farm Combo",
  comboSubtitle: "Mix & match your favourite flavoured makhanas. Add multiple packs of any flavour — combo discounts apply directly on the original MRP!",
  comboTier1Count: 3,
  comboTier1Discount: 11,
  comboTier1Label: "Trio Combo",
  comboTier1Tagline: "Pick any 3 — save 11% on MRP",
  comboTier1Badge: "✦ 11% OFF",
  comboTier1Emoji: "🌿",
  comboTier2Count: 5,
  comboTier2Discount: 15,
  comboTier2Label: "Penta Combo",
  comboTier2Tagline: "Pick any 5 — save 15% on MRP",
  comboTier2Badge: "✦ 15% OFF",
  comboTier2Emoji: "🌸",
  comboButtonText: "Shop My Combo",
  comboFooterNote: "✦ Combo discount applies to total MRP ✦ Multiples allowed ✦",
  comboProductIds: [] as string[],
  storeCategories: ["Makhana", "Nuts", "Pantry"] as string[],
};

const MAX_HERO_IMAGE_LENGTH = 2_500_000;

function isSafeHeroImage(value: string) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (trimmed.length > MAX_HERO_IMAGE_LENGTH) return false;
  // Local static paths or remote URLs
  if (trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  // Base64 data URIs for images (jpeg, png, webp, gif, svg)
  if (/^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed.replace(/\s+/g, ""))) {
    return true;
  }
  return false;
}

export async function GET() {
  try {
    const settings = await queryDatabase(() =>
      prisma.storeSettings.findUnique({
        where: { id: "default" },
      }),
      8_000,
      { isolateCooldown: true },
    );

    if (settings) {
      return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(DEFAULT_SETTINGS, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logServerError("security.admin.settings.load_failed", error);
    return NextResponse.json({ error: "Store settings are temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 8_000_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return NextResponse.json({ error: "Settings must be a JSON object." }, { status: 400 });
    }
    const body = parsed.value as Record<string, unknown>;

    const heroImages = [
      ["heroMainImage", body.heroMainImage],
      ["heroGheeImage", body.heroGheeImage],
      ["heroAlmondsImage", body.heroAlmondsImage],
      ["featuredProductImage", body.featuredProductImage],
      ["heartProductImage", body.heartProductImage],
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
      heartProductId: typeof body.heartProductId === "string" ? body.heartProductId : DEFAULT_SETTINGS.heartProductId,
      heartProductTitle: typeof body.heartProductTitle === "string" ? body.heartProductTitle : DEFAULT_SETTINGS.heartProductTitle,
      heartProductTagline: typeof body.heartProductTagline === "string" ? body.heartProductTagline : DEFAULT_SETTINGS.heartProductTagline,
      heartProductFeatures: Array.isArray(body.heartProductFeatures) && body.heartProductFeatures.every((feature) => typeof feature === "string")
        ? body.heartProductFeatures.slice(0, 12).map((feature) => feature.trim()).filter(Boolean)
        : DEFAULT_SETTINGS.heartProductFeatures,
      heartProductButtonText: typeof body.heartProductButtonText === "string" ? body.heartProductButtonText.slice(0, 60) : DEFAULT_SETTINGS.heartProductButtonText,
      heartProductButtonUrl: typeof body.heartProductButtonUrl === "string" ? body.heartProductButtonUrl.slice(0, 200) : DEFAULT_SETTINGS.heartProductButtonUrl,
      heartProductSubtitle: typeof body.heartProductSubtitle === "string" ? body.heartProductSubtitle.slice(0, 80) : DEFAULT_SETTINGS.heartProductSubtitle,
      heartProductImage: typeof body.heartProductImage === "string" ? body.heartProductImage : DEFAULT_SETTINGS.heartProductImage,
      featuredProductId: typeof body.featuredProductId === "string" ? body.featuredProductId : DEFAULT_SETTINGS.featuredProductId,
      featuredProductHeading: typeof body.featuredProductHeading === "string" ? body.featuredProductHeading : DEFAULT_SETTINGS.featuredProductHeading,
      featuredProductDescription: typeof body.featuredProductDescription === "string" ? body.featuredProductDescription : DEFAULT_SETTINGS.featuredProductDescription,
      featuredProductImage: typeof body.featuredProductImage === "string" ? body.featuredProductImage : DEFAULT_SETTINGS.featuredProductImage,
      featuredProductButtonText: typeof body.featuredProductButtonText === "string" ? body.featuredProductButtonText.slice(0, 60) : DEFAULT_SETTINGS.featuredProductButtonText,
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
      fssaiNumber: typeof body.fssaiNumber === "string" ? body.fssaiNumber.slice(0, 50) : DEFAULT_SETTINGS.fssaiNumber,
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
      comboEnabled:
        typeof body.comboEnabled === "boolean"
          ? body.comboEnabled
          : DEFAULT_SETTINGS.comboEnabled,
      comboEyebrow:
        typeof body.comboEyebrow === "string"
          ? body.comboEyebrow.slice(0, 80)
          : DEFAULT_SETTINGS.comboEyebrow,
      comboTitlePrefix:
        typeof body.comboTitlePrefix === "string"
          ? body.comboTitlePrefix.slice(0, 80)
          : DEFAULT_SETTINGS.comboTitlePrefix,
      comboTitleHighlight:
        typeof body.comboTitleHighlight === "string"
          ? body.comboTitleHighlight.slice(0, 100)
          : DEFAULT_SETTINGS.comboTitleHighlight,
      comboSubtitle:
        typeof body.comboSubtitle === "string"
          ? body.comboSubtitle.slice(0, 300)
          : DEFAULT_SETTINGS.comboSubtitle,
      comboTier1Count:
        body.comboTier1Count !== undefined && !isNaN(Number(body.comboTier1Count))
          ? Math.max(1, Math.min(20, Math.round(Number(body.comboTier1Count))))
          : DEFAULT_SETTINGS.comboTier1Count,
      comboTier1Discount:
        body.comboTier1Discount !== undefined && !isNaN(Number(body.comboTier1Discount))
          ? Math.max(1, Math.min(95, Math.round(Number(body.comboTier1Discount))))
          : DEFAULT_SETTINGS.comboTier1Discount,
      comboTier1Label:
        typeof body.comboTier1Label === "string"
          ? body.comboTier1Label.slice(0, 50)
          : DEFAULT_SETTINGS.comboTier1Label,
      comboTier1Tagline:
        typeof body.comboTier1Tagline === "string"
          ? body.comboTier1Tagline.slice(0, 120)
          : DEFAULT_SETTINGS.comboTier1Tagline,
      comboTier1Badge:
        typeof body.comboTier1Badge === "string"
          ? body.comboTier1Badge.slice(0, 40)
          : DEFAULT_SETTINGS.comboTier1Badge,
      comboTier1Emoji:
        typeof body.comboTier1Emoji === "string"
          ? body.comboTier1Emoji.slice(0, 10)
          : DEFAULT_SETTINGS.comboTier1Emoji,
      comboTier2Count:
        body.comboTier2Count !== undefined && !isNaN(Number(body.comboTier2Count))
          ? Math.max(1, Math.min(20, Math.round(Number(body.comboTier2Count))))
          : DEFAULT_SETTINGS.comboTier2Count,
      comboTier2Discount:
        body.comboTier2Discount !== undefined && !isNaN(Number(body.comboTier2Discount))
          ? Math.max(1, Math.min(95, Math.round(Number(body.comboTier2Discount))))
          : DEFAULT_SETTINGS.comboTier2Discount,
      comboTier2Label:
        typeof body.comboTier2Label === "string"
          ? body.comboTier2Label.slice(0, 50)
          : DEFAULT_SETTINGS.comboTier2Label,
      comboTier2Tagline:
        typeof body.comboTier2Tagline === "string"
          ? body.comboTier2Tagline.slice(0, 120)
          : DEFAULT_SETTINGS.comboTier2Tagline,
      comboTier2Badge:
        typeof body.comboTier2Badge === "string"
          ? body.comboTier2Badge.slice(0, 40)
          : DEFAULT_SETTINGS.comboTier2Badge,
      comboTier2Emoji:
        typeof body.comboTier2Emoji === "string"
          ? body.comboTier2Emoji.slice(0, 10)
          : DEFAULT_SETTINGS.comboTier2Emoji,
      comboButtonText:
        typeof body.comboButtonText === "string"
          ? body.comboButtonText.slice(0, 60)
          : DEFAULT_SETTINGS.comboButtonText,
      comboFooterNote:
        typeof body.comboFooterNote === "string"
          ? body.comboFooterNote.slice(0, 200)
          : DEFAULT_SETTINGS.comboFooterNote,
      comboProductIds:
        Array.isArray(body.comboProductIds) && body.comboProductIds.every((id) => typeof id === "string")
          ? body.comboProductIds.slice(0, 50)
          : DEFAULT_SETTINGS.comboProductIds,
      storeCategories:
        Array.isArray(body.storeCategories) && body.storeCategories.every((cat) => typeof cat === "string")
          ? body.storeCategories.map((c) => c.trim()).filter(Boolean).slice(0, 30)
          : DEFAULT_SETTINGS.storeCategories,
    };

    let saved = null;
    try {
      saved = await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: dataToSave,
        create: dataToSave,
      });
    } catch (error) {
      logServerError("security.admin.settings.persist_failed", error);
      return NextResponse.json({ error: "Settings could not be saved to the database. Please try again." }, { status: 503 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/products");
      revalidatePath("/combo");
      revalidatePath("/admin/settings");
    } catch {
      // Revalidation may throw outside request contexts in tests
    }

    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    logServerError("security.admin.settings.failed", error);
    return NextResponse.json(
      { error: "Failed to process settings", success: false },
      { status: 500 }
    );
  }
}
