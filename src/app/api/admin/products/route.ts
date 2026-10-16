import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
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
    throw new Error("Name, slug, SKU, category, image, valid price, and non-negative inventory are required.");
  }
  if (imageUrl.startsWith("data:") && imageUrl.length > 3_500_000) throw new Error("Please choose an image smaller than 2.5 MB.");
  const original = body.originalPrice === "" || body.originalPrice == null ? null : Number(body.originalPrice);
  if (original !== null && (!Number.isInteger(original) || original < 0)) throw new Error("Original price must be a valid amount.");
  return {
    name, slug, sku, category, imageUrl,
    shortDescription: String(body.shortDescription ?? "").trim(),
    description: String(body.description ?? "").trim(),
    basePrice, originalPrice: original,
    stockQuantity,
    lowStockThreshold: Math.max(0, Math.floor(Number(body.lowStockThreshold) || 0)),
    isAvailable: stockQuantity > 0 && body.isAvailable !== false,
    isFeatured: body.isFeatured === true,
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
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const product = parseProduct(await request.json());
    const { packSize, ...data } = product;
    const created = await prisma.product.create({
      data: { ...data, variants: { create: [{ name: packSize, packSize, price: data.basePrice, originalPrice: data.originalPrice, stockQuantity: data.stockQuantity, isAvailable: data.isAvailable }] } },
    });
    revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath("/");
    return NextResponse.json({ success: true, productId: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create product.";
    const duplicate = error instanceof Error && error.message.includes("Unique constraint");
    return NextResponse.json({ error: duplicate ? "That slug or SKU is already in use." : message }, { status: duplicate ? 409 : 400 });
  }
}
