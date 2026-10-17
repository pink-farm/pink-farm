import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

export async function PATCH(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Inventory data must be a JSON object." }, { status: 400 });
    const { productId, stockQuantity } = parsed.value as Record<string, unknown>;
    if (typeof productId !== "string" || typeof stockQuantity !== "number" || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return NextResponse.json({ error: "A product and non-negative whole-number inventory are required." }, { status: 400 });
    }
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id: productId }, data: { stockQuantity, isAvailable: stockQuantity > 0 } });
      await tx.productVariant.updateMany({ where: { productId }, data: { stockQuantity, isAvailable: stockQuantity > 0 } });
      return updated;
    });
    revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath(`/products/${product.slug}`); revalidatePath("/");
    return NextResponse.json({ success: true, stockQuantity: product.stockQuantity });
  } catch (error) {
    logServerError("security.admin/products.inventory.failed", error);
    return NextResponse.json({ error: "Could not update inventory. Refresh and try again." }, { status: 400 });
  }
}
