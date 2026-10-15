import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { productId, stockQuantity } = await request.json();
    if (typeof productId !== "string" || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
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
    console.error("Failed to update product inventory:", error);
    return NextResponse.json({ error: "Could not update inventory. Refresh and try again." }, { status: 400 });
  }
}
