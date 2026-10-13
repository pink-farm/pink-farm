import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { productId, isAvailable } = body;

    if (!productId || typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "productId and isAvailable boolean are required" },
        { status: 400 }
      );
    }

    // Update product availability
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });

    // Also update any child variants so variant-level checks match
    await prisma.productVariant.updateMany({
      where: { productId },
      data: { isAvailable },
    });

    return NextResponse.json({
      success: true,
      productId: updatedProduct.id,
      isAvailable: updatedProduct.isAvailable,
      message: `Product marked as ${isAvailable ? "In Stock" : "Out of Stock"}`,
    });
  } catch (error) {
    console.error("Failed to toggle product stock:", error);
    return NextResponse.json(
      { error: "Internal server error while updating product status" },
      { status: 500 }
    );
  }
}
