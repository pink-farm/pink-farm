import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

function parseProduct(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const sku = String(body.sku ?? "").trim().toUpperCase();
  const category = String(body.category ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const basePrice = Number(body.basePrice);
  const stockQuantity = Number(body.stockQuantity);
  if (!name || !slug || !sku || !category || !imageUrl || !Number.isInteger(basePrice) || basePrice < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) throw new Error("Name, slug, SKU, category, image, valid price, and non-negative inventory are required.");
  if (imageUrl.startsWith("data:") && imageUrl.length > 3_500_000) throw new Error("Please choose an image smaller than 2.5 MB.");
  const original = body.originalPrice === "" || body.originalPrice == null ? null : Number(body.originalPrice);
  if (original !== null && (!Number.isInteger(original) || original < 0)) throw new Error("Original price must be a valid amount.");
  return {
    name, slug, sku, category, imageUrl,
    shortDescription: String(body.shortDescription ?? "").trim(), description: String(body.description ?? "").trim(),
    basePrice, originalPrice: original, stockQuantity,
    lowStockThreshold: Math.max(0, Math.floor(Number(body.lowStockThreshold) || 0)),
    isAvailable: stockQuantity > 0 && body.isAvailable !== false, isFeatured: body.isFeatured === true,
    ingredients: String(body.ingredients ?? "").trim() || null, nutritionalInfo: String(body.nutritionalInfo ?? "").trim() || null,
    storage: String(body.storage ?? "").trim() || null, allergens: String(body.allergens ?? "").trim() || null,
    deliveryNotes: String(body.deliveryNotes ?? "").trim() || null, seoTitle: String(body.seoTitle ?? "").trim() || null,
    seoDesc: String(body.seoDesc ?? "").trim() || null,
    tags: JSON.stringify(String(body.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)),
    packSize: String(body.packSize ?? "").trim() || "Standard",
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const { packSize, ...data } = parseProduct(await request.json());
    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id }, data });
      const variant = await tx.productVariant.findFirst({ where: { productId: id } });
      if (variant) await tx.productVariant.updateMany({ where: { productId: id }, data: { name: packSize, packSize, price: data.basePrice, originalPrice: data.originalPrice, stockQuantity: data.stockQuantity, isAvailable: data.isAvailable } });
      else await tx.productVariant.create({ data: { productId: id, name: packSize, packSize, price: data.basePrice, originalPrice: data.originalPrice, stockQuantity: data.stockQuantity, isAvailable: data.isAvailable } });
      return product;
    });
    revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath(`/products/${updated.slug}`); revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update product.";
    const duplicate = error instanceof Error && error.message.includes("Unique constraint");
    return NextResponse.json({ error: duplicate ? "That slug or SKU is already in use." : message }, { status: duplicate ? 409 : 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Could not delete product. Refresh and try again." }, { status: 400 });
  }
}
