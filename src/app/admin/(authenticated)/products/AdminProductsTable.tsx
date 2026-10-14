"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Search, 
  Package, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name: string;
  packSize: string;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  isAvailable: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  imageUrl: string | null;
  basePrice: number;
  originalPrice: number | null;
  sku: string;
  category: string;
  stockQuantity: number;
  isAvailable: boolean;
  variants: ProductVariant[];
}

export function AdminProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "instock" | "outofstock">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleStock = async (product: Product) => {
    const nextStatus = !product.isAvailable;
    setLoadingId(product.id);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: nextStatus } : p))
    );

    try {
      const res = await fetch("/api/admin/products/toggle-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, isAvailable: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
      setToastMessage(
        `${product.name} is now ${nextStatus ? "In Stock" : "marked Out of Stock"}`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error toggling stock:", err);
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !nextStatus } : p))
      );
      setToastMessage("Failed to update product status. Please try again.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "instock") return p.isAvailable;
    if (statusFilter === "outofstock") return !p.isAvailable;
    return true;
  });

  const inStockCount = products.filter((p) => p.isAvailable).length;
  const outOfStockCount = products.filter((p) => !p.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Total Catalog</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{products.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-600 tracking-wider">In Stock</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{inStockCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-rose-600 tracking-wider">Out of Stock</div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{outOfStockCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-brand-green"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter("instock")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === "instock" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            In Stock ({inStockCount})
          </button>
          <button
            onClick={() => setStatusFilter("outofstock")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === "outofstock" ? "bg-white text-rose-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 bg-gray-50/50">
                <th className="py-4 px-6 font-semibold">Product Name</th>
                <th className="py-4 px-6 font-semibold">Category</th>
                <th className="py-4 px-6 font-semibold">Pack Size</th>
                <th className="py-4 px-6 font-semibold">Price</th>
                <th className="py-4 px-6 font-semibold text-center">Stock Status</th>
                <th className="py-4 px-6 font-semibold text-right">Configure Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.map((p) => {
                const isLoading = loadingId === p.id;
                const packSizes = p.variants?.map((v) => v.packSize).filter(Boolean).join(", ") || "Standard";

                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{p.name}</span>
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="text-gray-400 hover:text-brand-green"
                              title="View on store"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-gray-600 font-medium text-xs">
                      {packSizes}
                    </td>

                    <td className="py-4 px-6 font-bold text-gray-900">
                      ₹{formatPrice(p.basePrice)}
                      {p.originalPrice && (
                        <span className="ml-2 text-xs text-gray-400 line-through font-normal">
                          ₹{formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          p.isAvailable
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {p.isAvailable ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {p.isAvailable ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleStock(p)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.isAvailable
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-95"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95"
                        } disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : p.isAvailable ? (
                          <>
                            <XCircle size={13} />
                            Mark Out of Stock
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            Mark In Stock
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Package size={36} className="mx-auto mb-2 text-gray-300" />
                    No products matched your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
