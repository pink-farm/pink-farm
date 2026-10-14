import { ExternalLink } from "lucide-react";
import Link from "next/link";
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
            Manage your store catalog and configure stock availability (In Stock / Out of Stock).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            <ExternalLink size={15} />
            View Storefront
          </Link>
        </div>
      </div>

      <AdminProductsTable initialProducts={products} />
    </div>
  );
}
