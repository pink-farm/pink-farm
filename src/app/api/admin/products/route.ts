import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { AdminProductInputError, classifyAdminProductError } from "@/lib/admin-product-errors.mjs";
import { getStoreProducts } from "@/lib/defaultProducts";

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await getStoreProducts({ includeUnavailable: true });
  return NextResponse.json(products);
}

function parseProduct(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const sku = String(body.sku ?? "").trim().toUpperCase();
  const category = String(body.category ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const basePrice = Number(body.basePrice);
  const stockQuantity = Number(body.stockQuantity);
  if (!name || !slug || !sku || !category || !imageUrl || !Number.isInteger(basePrice) || basePrice < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new AdminProductInputError("Name, slug, SKU, category, image, valid price, and non-negative inventory are required.");
  }
  if (imageUrl.startsWith("data:") && imageUrl.length > 3_500_000) throw new AdminProductInputError("Please choose an image smaller than 2.5 MB.");
  const original = body.originalPrice === "" || body.originalPrice == null ? null : Number(body.originalPrice);
  if (original !== null && (!Number.isInteger(original) || original < 0)) throw new AdminProductInputError("Original price must be a valid amount.");
  const additionalImages = (() => {
    if (Array.isArray(body.additionalImages)) {
      return JSON.stringify(body.additionalImages.filter((img) => typeof img === "string" && img.trim().length > 0));
    }
    if (typeof body.additionalImages === "string" && body.additionalImages.trim()) {
      return body.additionalImages.trim();
    }
    return "[]";
  })();

  return {
    name, slug, sku, category, imageUrl,
    additionalImages,
    shortDescription: String(body.shortDescription ?? "").trim(),
    description: String(body.description ?? "").trim(),
    basePrice, originalPrice: original,
    stockQuantity,
    lowStockThreshold: Math.max(0, Math.floor(Number(body.lowStockThreshold) || 0)),
    isAvailable: stockQuantity > 0 && body.isAvailable !== false,
    isFeatured: body.isFeatured === true,
    highlights: String(body.highlights ?? "").trim() || null,
    ingredients: String(body.ingredients ?? "").trim() || null,
    nutritionalInfo: String(body.nutritionalInfo ?? "").trim() || null,
    storage: String(body.storage ?? "").trim() || null,
    allergens: String(body.allergens ?? "").trim() || null,
    deliveryNotes: String(body.deliveryNotes ?? "").trim() || null,
    seoTitle: String(body.seoTitle ?? "").trim() || null,
    seoDesc: String(body.seoDesc ?? "").trim() || null,
    tags: JSON.stringify(String(body.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)),
    packSize: String(body.packSize ?? "").trim() || "Standard",
  };
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 15_000_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Product data must be a JSON object." }, { status: 400 });
    const product = parseProduct(parsed.value as Record<string, unknown>);
    const { packSize, ...data } = product;
    const created = await prisma.product.create({
      data: { ...data, variants: { create: [{ name: packSize, packSize, price: data.basePrice, originalPrice: data.originalPrice, stockQuantity: data.stockQuantity, isAvailable: data.isAvailable }] } },
    });

    try {
      const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
      const currentCategories = settings?.storeCategories || ["Makhana", "Nuts", "Pantry"];
      if (!currentCategories.some((category) => category.toLowerCase() === data.category.toLowerCase())) {
        await prisma.storeSettings.upsert({
          where: { id: "default" },
          update: { storeCategories: [...currentCategories, data.category] },
          create: { storeCategories: [...currentCategories, data.category] },
        });
      }
    } catch {
      // Product creation succeeds even if optional category synchronization is temporarily unavailable.
    }

    revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath("/");
    return NextResponse.json({ success: true, productId: created.id });
  } catch (error) {
    const result = classifyAdminProductError(error);
    if (result.status === 500) console.error("security.admin_product.create_failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
