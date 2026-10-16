"use client";

import { useEffect, useState } from "react";
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
  LayoutGrid
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import { ProductFormModal, type EditableProduct } from "./ProductFormModal";

interface ProductVariant {
  id: string;
  name: string;
  packSize: string;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  isAvailable: boolean;
}

type Product = EditableProduct & { variants: ProductVariant[] };

export function AdminProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const { storeCategories } = useSettingsStore();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "instock" | "outofstock">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  useEffect(() => { setProducts(initialProducts); setStockDrafts({}); }, [initialProducts]);

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

  const saveInventory = async (product: Product) => {
    const stockQuantity = Number(stockDrafts[product.id] ?? quantity(product));
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) return;
    setLoadingId(product.id);
    try {
      const response = await fetch("/api/admin/products/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, stockQuantity }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update inventory.");
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stockQuantity, isAvailable: stockQuantity > 0, variants: item.variants.map((variant) => ({ ...variant, stockQuantity, isAvailable: stockQuantity > 0 })) } : item));
      setStockDrafts((current) => ({ ...current, [product.id]: String(stockQuantity) }));
      router.refresh(); setToastMessage(`Inventory updated: ${stockQuantity} units.`); setTimeout(() => setToastMessage(null), 3000);
    } catch (err) { setToastMessage(err instanceof Error ? err.message : "Could not update inventory."); setTimeout(() => setToastMessage(null), 3000); }
    finally { setLoadingId(null); }
  };

  const allCategories = Array.from(
    new Set([
      ...(storeCategories || []),
      ...products.map((p) => p.category).filter(Boolean),
    ])
  );

  const quantity = (p: Product) => p.variants?.[0]?.stockQuantity ?? p.stockQuantity;
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== "all" && p.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    if (statusFilter === "instock") return p.isAvailable && quantity(p) > 0;
    if (statusFilter === "outofstock") return !p.isAvailable || quantity(p) <= 0;
    return true;
  });

  const inStockCount = products.filter((p) => p.isAvailable && quantity(p) > 0).length;
  const outOfStockCount = products.length - inStockCount;

  return (
    <div className="space-y-6">
      {(showProductForm || editingProduct) && <ProductFormModal product={editingProduct} onClose={() => { setShowProductForm(false); setEditingProduct(null); }} onSaved={() => { setShowProductForm(false); setEditingProduct(null); router.refresh(); setToastMessage("Product saved successfully."); setTimeout(() => setToastMessage(null), 3000); }} onDeleted={() => { setShowProductForm(false); setEditingProduct(null); setProducts((items) => items.filter((item) => item.id !== editingProduct?.id)); router.refresh(); setToastMessage("Product deleted."); setTimeout(() => setToastMessage(null), 3000); }} />}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings?tab=categories"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
            title="Manage Storefront Category Filter Bar"
          >
            <LayoutGrid size={16} className="text-brand-green" />
            <span>Manage Categories</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
              {storeCategories.length} active
            </span>
          </Link>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-95 cursor-pointer"
        >
          <span className="text-lg leading-none">+</span> Add New Product
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
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

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-hidden focus:border-brand-green cursor-pointer"
            >
              <option value="all">All Categories ({products.length})</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter("instock")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "instock" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStatusFilter("outofstock")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "outofstock" ? "bg-white text-rose-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
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
                <th className="py-4 px-6 font-semibold text-center">Inventory</th>
                <th className="py-4 px-6 font-semibold text-center">Stock Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.map((p) => {
                const isLoading = loadingId === p.id;
                const packSizes = p.variants?.map((v) => v.packSize).filter(Boolean).join(", ") || "Standard";
                const stock = quantity(p);

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

                    <td className="py-4 px-6"><div className="flex items-center justify-center gap-2"><input aria-label={`Inventory quantity for ${p.name}`} type="number" min="0" step="1" value={stockDrafts[p.id] ?? stock} onChange={(event) => setStockDrafts((current) => ({ ...current, [p.id]: event.target.value }))} className={`w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center font-semibold focus:border-brand-green focus:outline-none ${stock <= p.lowStockThreshold ? "text-rose-700" : "text-gray-800"}`}/><button onClick={() => void saveInventory(p)} disabled={isLoading || Number(stockDrafts[p.id] ?? stock) === stock} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40">Save</button></div></td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          p.isAvailable && stock > 0
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {p.isAvailable && stock > 0 ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {p.isAvailable && stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right"><div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingProduct(p); setShowProductForm(false); }} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">Edit</button><button
                        onClick={() => toggleStock(p)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.isAvailable && stock > 0
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-95"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95"
                        } disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : p.isAvailable && stock > 0 ? (
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
                    </div></td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
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
