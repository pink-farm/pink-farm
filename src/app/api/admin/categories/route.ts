import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const DEFAULT_CATEGORIES = ["Makhana", "Nuts", "Pantry"];

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [settings, products] = await Promise.all([
      prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: { storeCategories: true, comboEnabled: true },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          imageUrl: true,
          sku: true,
          basePrice: true,
          originalPrice: true,
          stockQuantity: true,
          isAvailable: true,
          isFeatured: true,
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stockQuantity: true,
              isAvailable: true,
            },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      }),
    ]);

    const configuredCategories =
      Array.isArray(settings?.storeCategories) && settings.storeCategories.length > 0
        ? settings.storeCategories
        : DEFAULT_CATEGORIES;

    // Detect all distinct categories from actual products
    const productCategoriesSet = new Set<string>();
    products.forEach((p) => {
      const cat = p.category?.trim();
      if (cat) productCategoriesSet.add(cat);
    });

    // Detect orphaned categories (categories assigned to products that are not configured in storeCategories)
    const configuredLower = new Set(configuredCategories.map((c) => c.toLowerCase()));
    const orphanedCategories: { name: string; count: number }[] = [];

    productCategoriesSet.forEach((prodCat) => {
      if (!configuredLower.has(prodCat.toLowerCase())) {
        const count = products.filter(
          (p) => p.category?.toLowerCase() === prodCat.toLowerCase()
        ).length;
        orphanedCategories.push({ name: prodCat, count });
      }
    });

    // Compute products grouped by configured category
    const categoriesWithProducts = configuredCategories.map((catName) => {
      const matchingProducts = products.filter(
        (p) => p.category?.toLowerCase() === catName.toLowerCase()
      );
      return {
        name: catName,
        count: matchingProducts.length,
        products: matchingProducts,
      };
    });

    return NextResponse.json({
      storeCategories: configuredCategories,
      categoriesWithProducts,
      orphanedCategories,
      totalProducts: products.length,
      allProducts: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        sku: p.sku,
        imageUrl: p.imageUrl,
        basePrice: p.basePrice,
        isAvailable: p.isAvailable,
      })),
      comboEnabled: settings?.comboEnabled ?? true,
    });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "Failed to load categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawName = typeof body.name === "string" ? body.name.trim() : "";

    if (!rawName) {
      return NextResponse.json(
        { error: "Category name cannot be empty." },
        { status: 400 }
      );
    }

    if (rawName.length > 50) {
      return NextResponse.json(
        { error: "Category name must be 50 characters or less." },
        { status: 400 }
      );
    }

    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });

    const currentCats =
      Array.isArray(settings?.storeCategories) && settings.storeCategories.length > 0
        ? settings.storeCategories
        : DEFAULT_CATEGORIES;

    // Check duplicate (case-insensitive)
    if (currentCats.some((c) => c.toLowerCase() === rawName.toLowerCase())) {
      return NextResponse.json(
        { error: `Category "${rawName}" already exists.` },
        { status: 400 }
      );
    }

    const updatedCategories = [...currentCats, rawName];

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: { storeCategories: updatedCategories },
      create: { storeCategories: updatedCategories },
    });

    // If productIds were supplied to immediately assign to this new category
    if (Array.isArray(body.assignProductIds) && body.assignProductIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: body.assignProductIds } },
        data: { category: rawName },
      });
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin/settings");
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: `Category "${rawName}" created successfully.`,
      storeCategories: updatedCategories,
    });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action || "update";

    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });

    const currentCats =
      Array.isArray(settings?.storeCategories) && settings.storeCategories.length > 0
        ? settings.storeCategories
        : DEFAULT_CATEGORIES;

    // ACTION: REORDER
    if (action === "reorder") {
      const newOrder = body.categories;
      if (!Array.isArray(newOrder) || newOrder.length === 0) {
        return NextResponse.json(
          { error: "Invalid categories list for reordering." },
          { status: 400 }
        );
      }

      // Sanitize and ensure no empty entries
      const sanitized = newOrder
        .map((c: unknown) => (typeof c === "string" ? c.trim() : ""))
        .filter(Boolean);

      await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: { storeCategories: sanitized },
        create: { storeCategories: sanitized },
      });

      revalidatePath("/admin/categories");
      revalidatePath("/admin/settings");
      revalidatePath("/products");
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        message: "Category order updated.",
        storeCategories: sanitized,
      });
    }

    // ACTION: RENAME
    if (action === "rename") {
      const oldName = typeof body.oldName === "string" ? body.oldName.trim() : "";
      const newName = typeof body.newName === "string" ? body.newName.trim() : "";
      const updateProducts = body.updateProducts !== false; // Default to true

      if (!oldName || !newName) {
        return NextResponse.json(
          { error: "Old category name and new category name are required." },
          { status: 400 }
        );
      }

      if (newName.length > 50) {
        return NextResponse.json(
          { error: "Category name must be 50 characters or less." },
          { status: 400 }
        );
      }

      // Check if new name already exists elsewhere
      if (
        oldName.toLowerCase() !== newName.toLowerCase() &&
        currentCats.some((c) => c.toLowerCase() === newName.toLowerCase())
      ) {
        return NextResponse.json(
          { error: `A category named "${newName}" already exists.` },
          { status: 400 }
        );
      }

      const updatedCategories = currentCats.map((c) =>
        c.toLowerCase() === oldName.toLowerCase() ? newName : c
      );

      // If the old name was an orphaned category not in currentCats, add newName
      if (!currentCats.some((c) => c.toLowerCase() === oldName.toLowerCase())) {
        updatedCategories.push(newName);
      }

      await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: { storeCategories: updatedCategories },
        create: { storeCategories: updatedCategories },
      });

      let updatedProductCount = 0;
      if (updateProducts) {
        // Update all products that have oldName (matching case-insensitively via find + update)
        const productsToUpdate = await prisma.product.findMany({
          where: {
            category: { equals: oldName, mode: "insensitive" },
          },
          select: { id: true },
        });

        if (productsToUpdate.length > 0) {
          const ids = productsToUpdate.map((p) => p.id);
          const updateResult = await prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { category: newName },
          });
          updatedProductCount = updateResult.count;
        }
      }

      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      revalidatePath("/admin/settings");
      revalidatePath("/products");
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        message: `Renamed "${oldName}" to "${newName}". Updated ${updatedProductCount} product(s).`,
        storeCategories: updatedCategories,
        updatedProductCount,
      });
    }

    // ACTION: REASSIGN PRODUCTS
    if (action === "reassign") {
      const productIds = body.productIds;
      const targetCategory = typeof body.targetCategory === "string" ? body.targetCategory.trim() : "";

      if (!Array.isArray(productIds) || productIds.length === 0 || !targetCategory) {
        return NextResponse.json(
          { error: "Product IDs and target category are required." },
          { status: 400 }
        );
      }

      const updateResult = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { category: targetCategory },
      });

      // Also ensure target category is in storeCategories
      if (!currentCats.some((c) => c.toLowerCase() === targetCategory.toLowerCase())) {
        const updatedCats = [...currentCats, targetCategory];
        await prisma.storeSettings.upsert({
          where: { id: "default" },
          update: { storeCategories: updatedCats },
          create: { storeCategories: updatedCats },
        });
      }

      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        message: `Reassigned ${updateResult.count} product(s) to "${targetCategory}".`,
        updatedCount: updateResult.count,
      });
    }

    // ACTION: RESET
    if (action === "reset") {
      await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: { storeCategories: DEFAULT_CATEGORIES },
        create: { storeCategories: DEFAULT_CATEGORIES },
      });

      revalidatePath("/admin/categories");
      revalidatePath("/admin/settings");
      revalidatePath("/products");
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        message: "Categories reset back to store defaults.",
        storeCategories: DEFAULT_CATEGORIES,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "Failed to update categories." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let categoryName = searchParams.get("name")?.trim();
    let reassignTo = searchParams.get("reassignTo")?.trim() || null;

    if (!categoryName) {
      try {
        const body = await request.json();
        categoryName = typeof body.name === "string" ? body.name.trim() : "";
        reassignTo = typeof body.reassignTo === "string" ? body.reassignTo.trim() : null;
      } catch {}
    }

    if (!categoryName) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });

    const currentCats =
      Array.isArray(settings?.storeCategories) && settings.storeCategories.length > 0
        ? settings.storeCategories
        : DEFAULT_CATEGORIES;

    const updatedCategories = currentCats.filter(
      (c) => c.toLowerCase() !== categoryName?.toLowerCase()
    );

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: { storeCategories: updatedCategories },
      create: { storeCategories: updatedCategories },
    });

    // If reassignTo is specified, migrate affected products to target category
    let reassignedCount = 0;
    if (reassignTo) {
      const affectedProducts = await prisma.product.findMany({
        where: { category: { equals: categoryName, mode: "insensitive" } },
        select: { id: true },
      });

      if (affectedProducts.length > 0) {
        const ids = affectedProducts.map((p) => p.id);
        const result = await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { category: reassignTo },
        });
        reassignedCount = result.count;
      }
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin/settings");
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: `Category "${categoryName}" deleted.${
        reassignedCount > 0
          ? ` Reassigned ${reassignedCount} product(s) to "${reassignTo}".`
          : ""
      }`,
      storeCategories: updatedCategories,
      reassignedCount,
    });
  } catch (error) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}
