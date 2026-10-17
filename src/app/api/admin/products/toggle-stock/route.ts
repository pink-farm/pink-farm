import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Stock data must be a JSON object." }, { status: 400 });
    const { productId, isAvailable } = parsed.value as Record<string, unknown>;

    if (typeof productId !== "string" || !productId || typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "productId and isAvailable boolean are required" },
        { status: 400 }
      );
    }

    // Resilient lookup: check by exact id, or by slug/sku if fallback id was passed
    let target = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!target) {
      target = await prisma.product.findFirst({
        where: {
          OR: [{ slug: productId }, { sku: productId }],
        },
      });
    }

    if (!target) {
      return NextResponse.json(
        { error: "Product not found in database" },
        { status: 404 }
      );
    }

    if (isAvailable) {
      const variant = await prisma.productVariant.findFirst({ where: { productId: target.id } });
      if (variant ? variant.stockQuantity <= 0 : target.stockQuantity <= 0) {
        return NextResponse.json({ error: "Add inventory before marking this product in stock." }, { status: 409 });
      }
    }

    // Update product availability
    const updatedProduct = await prisma.product.update({
      where: { id: target.id },
      data: { isAvailable },
    });

    // Also update any child variants so variant-level checks match
    await prisma.productVariant.updateMany({
      where: { productId: target.id },
      data: { isAvailable },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      productId: updatedProduct.id,
      isAvailable: updatedProduct.isAvailable,
      message: `Product marked as ${isAvailable ? "In Stock" : "Out of Stock"}`,
    });
  } catch (error) {
    logServerError("security.admin/products.toggle-stock.failed", error);
    return NextResponse.json(
      { error: "Internal server error while updating product status" },
      { status: 500 }
    );
  }
}
