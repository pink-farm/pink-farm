import { getStoreProducts, getStoreSettings } from "@/lib/defaultProducts";
import { AdminCategoriesClient } from "./AdminCategoriesClient";

export const instant = false;

const DEFAULT_CATEGORIES = ["Makhana", "Nuts", "Pantry"];

export default async function AdminCategoriesPage() {
  const [settings, products] = await Promise.all([
    getStoreSettings(),
    getStoreProducts({ includeUnavailable: true }),
  ]);

  const configuredCategories =
    Array.isArray(settings?.storeCategories) && settings.storeCategories.length > 0
      ? settings.storeCategories
      : DEFAULT_CATEGORIES;

  const comboEnabled = settings?.comboEnabled ?? true;

  // Detect orphaned categories (categories assigned to products that are not configured in storeCategories)
  const configuredLower = new Set(configuredCategories.map((c) => c.toLowerCase()));
  const productCategoriesSet = new Set<string>();
  products.forEach((p) => {
    const cat = p.category?.trim();
    if (cat) productCategoriesSet.add(cat);
  });

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

  return (
    <AdminCategoriesClient
      initialCategories={configuredCategories}
      initialCategoriesWithProducts={categoriesWithProducts}
      initialOrphanedCategories={orphanedCategories}
      allProducts={products}
      comboEnabled={comboEnabled}
    />
  );
}
