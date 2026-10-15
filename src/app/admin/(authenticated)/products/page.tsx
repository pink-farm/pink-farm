import { AdminProductsTable } from "./AdminProductsTable";
import { getStoreProducts } from "@/lib/defaultProducts";

export const instant = false;

export default async function AdminProductsPage() {
  const products = await getStoreProducts({ includeUnavailable: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Products & Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage product details, pricing, images, and inventory quantities.
          </p>
        </div>
      </div>

      <AdminProductsTable initialProducts={products} />
    </div>
  );
}
