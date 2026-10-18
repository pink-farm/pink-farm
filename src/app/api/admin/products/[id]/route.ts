import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { AdminProductInputError, classifyAdminProductError } from "@/lib/admin-product-errors.mjs";

function parseProduct(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const sku = String(body.sku ?? "").trim().toUpperCase();
  const category = String(body.category ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const basePrice = Number(body.basePrice);
  const stockQuantity = Number(body.stockQuantity);
  if (!name || !slug || !sku || !category || !imageUrl || !Number.isInteger(basePrice) || basePrice < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) throw new AdminProductInputError("Name, slug, SKU, category, image, valid price, and non-negative inventory are required.");
  if (imageUrl.startsWith("data:") && imageUrl.length > 3_500_000) throw new AdminProductInputError("Please choose an image smaller than 2.5 MB.");
  const original = body.originalPrice === "" || body.originalPrice == null ? null : Number(body.originalPrice);
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
    shortDescription: String(body.shortDescription ?? "").trim(), description: String(body.description ?? "").trim(),
    basePrice, originalPrice: original, stockQuantity,
    lowStockThreshold: Math.max(0, Math.floor(Number(body.lowStockThreshold) || 0)),
    isAvailable: body.isAvailable === true || body.isAvailable === "true",
    isFeatured: body.isFeatured === true || body.isFeatured === "true",
    highlights: String(body.highlights ?? "").trim() || null,
    ingredients: String(body.ingredients ?? "").trim() || null, nutritionalInfo: String(body.nutritionalInfo ?? "").trim() || null,
    storage: String(body.storage ?? "").trim() || null, allergens: String(body.allergens ?? "").trim() || null,
    deliveryNotes: String(body.deliveryNotes ?? "").trim() || null, seoTitle: String(body.seoTitle ?? "").trim() || null,
    seoDesc: String(body.seoDesc ?? "").trim() || null,
    tags: JSON.stringify(String(body.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)),
    packSize: String(body.packSize ?? "").trim() || "Standard",
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const parsed = await readBoundedJson(request, 15_000_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Product data must be a JSON object." }, { status: 400 });
    const { packSize, ...data } = parseProduct(parsed.value as Record<string, unknown>);
    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id }, data });
      const variant = await tx.productVariant.findFirst({ where: { productId: id } });
      if (variant) await tx.productVariant.updateMany({ where: { productId: id }, data: { name: packSize, packSize, price: data.basePrice, originalPrice: data.originalPrice, stockQuantity: data.stockQuantity, isAvailable: data.isAvailable } });
      else await tx.productVariant.create({ data: { productId: id, name: packSize, packSize, price: data.basePrice, originalPrice: data.originalPrice, stockQuantity: data.stockQuantity, isAvailable: data.isAvailable } });
      return product;
    });

    try {
      const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
      const currentCats = settings?.storeCategories || ["Makhana", "Nuts", "Pantry"];
      if (data.category && !currentCats.some((c) => c.toLowerCase() === data.category.toLowerCase())) {
        await prisma.storeSettings.upsert({
          where: { id: "default" },
          update: { storeCategories: [...currentCats, data.category] },
          create: { storeCategories: [...currentCats, data.category] },
        });
      }
    } catch {}

    revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath(`/products/${updated.slug}`); revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = classifyAdminProductError(error);
    if (result.status === 500) console.error("security.admin_product.update_failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const product = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
      if (!existing) throw new Error("PRODUCT_NOT_FOUND");
      if (existing._count.orderItems > 0) throw new Error("PRODUCT_HAS_ORDER_HISTORY");
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
      return existing;
    });
    revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath(`/products/${product.slug}`); revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (error instanceof Error && error.message === "PRODUCT_HAS_ORDER_HISTORY") return NextResponse.json({ error: "This product has order history and can’t be deleted. Mark it out of stock to remove it from the storefront." }, { status: 409 });
    logServerError("security.admin/products.id.failed", error);
    return NextResponse.json({ error: "Could not delete product. Refresh and try again." }, { status: 500 });
  }
}
