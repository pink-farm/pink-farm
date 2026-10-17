"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Edit3,
  MoveUp,
  MoveDown,
  RotateCcw,
  Sparkles,
  Tag,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Search,
  Package,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";

interface CategoryProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl?: string;
  sku: string;
  basePrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured?: boolean;
}

interface CategoryGroup {
  name: string;
  count: number;
  products: CategoryProduct[];
}

interface OrphanedCategory {
  name: string;
  count: number;
}

interface AdminCategoriesClientProps {
  initialCategories: string[];
  initialCategoriesWithProducts: CategoryGroup[];
  initialOrphanedCategories: OrphanedCategory[];
  allProducts: CategoryProduct[];
  comboEnabled: boolean;
}

export function AdminCategoriesClient({
  initialCategories,
  initialCategoriesWithProducts,
  initialOrphanedCategories,
  allProducts,
  comboEnabled,
}: AdminCategoriesClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const setStoreSettings = useSettingsStore((s) => s.setSettings);

  // Core Category State
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryGroup[]>(
    initialCategoriesWithProducts
  );
  const [orphanedCategories, setOrphanedCategories] = useState<OrphanedCategory[]>(
    initialOrphanedCategories
  );
  const [productsList, setProductsList] = useState<CategoryProduct[]>(allProducts);

  // UI State
  const [previewTab, setPreviewTab] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedProductIdsForNew, setSelectedProductIdsForNew] = useState<string[]>([]);

  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [syncProductsOnRename, setSyncProductsOnRename] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [reassignCategoryOnDelete, setReassignCategoryOnDelete] = useState<string>("");

  const [assignModalCategory, setAssignModalCategory] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedProductIdsToAssign, setSelectedProductIdsToAssign] = useState<string[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshLocalGroups = useCallback((newCatList: string[], updatedProducts: CategoryProduct[]) => {
    setCategories(newCatList);
    setProductsList(updatedProducts);
    setStoreSettings({ storeCategories: newCatList });

    const newGroups = newCatList.map((catName) => {
      const matching = updatedProducts.filter(
        (p) => p.category?.toLowerCase() === catName.toLowerCase()
      );
      return { name: catName, count: matching.length, products: matching };
    });
    setCategoriesWithProducts(newGroups);

    const configuredLower = new Set(newCatList.map((c) => c.toLowerCase()));
    const productCategoriesSet = new Set<string>();
    updatedProducts.forEach((p) => {
      if (p.category) productCategoriesSet.add(p.category.trim());
    });

    const newOrphaned: OrphanedCategory[] = [];
    productCategoriesSet.forEach((prodCat) => {
      if (!configuredLower.has(prodCat.toLowerCase())) {
        const count = updatedProducts.filter(
          (p) => p.category?.toLowerCase() === prodCat.toLowerCase()
        ).length;
        newOrphaned.push({ name: prodCat, count });
      }
    });
    setOrphanedCategories(newOrphaned);
  }, [setStoreSettings]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.storeCategories) && data.storeCategories.length > 0) {
          refreshLocalGroups(data.storeCategories, data.allProducts || allProducts);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch categories on mount:", err);
      });
  }, [allProducts, refreshLocalGroups]);

  const toggleExpand = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // -------------------------------------------------------------
  // REORDER ACTIONS (Move Up / Down)
  // -------------------------------------------------------------
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setCategories(updated);
    setStoreSettings({ storeCategories: updated });

    setLoadingAction(`move-${moved}`);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", categories: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder.");
      showToast(`Moved "${moved}" ${direction}. Order updated.`);
      refreshLocalGroups(updated, productsList);
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error reordering.", "error");
      // Revert
      setCategories(categories);
    } finally {
      setLoadingAction(null);
    }
  };

  // -------------------------------------------------------------
  // ADD CATEGORY
  // -------------------------------------------------------------
  const handleAddCategorySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameToAdd = newCategoryName.trim();
    if (!nameToAdd) return;

    if (categories.some((c) => c.toLowerCase() === nameToAdd.toLowerCase())) {
      showToast(`Category "${nameToAdd}" already exists.`, "error");
      return;
    }

    setLoadingAction("add");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameToAdd,
          assignProductIds: selectedProductIdsForNew,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category.");

      const updatedProducts = productsList.map((p) =>
        selectedProductIdsForNew.includes(p.id) ? { ...p, category: nameToAdd } : p
      );

      const updatedCats = data.storeCategories || [...categories, nameToAdd];
      refreshLocalGroups(updatedCats, updatedProducts);
      showToast(`Category "${nameToAdd}" created!`);

      // Reset modal
      setIsAddModalOpen(false);
      setNewCategoryName("");
      setSelectedProductIdsForNew([]);
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create category.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  // -------------------------------------------------------------
  // RENAME CATEGORY
  // -------------------------------------------------------------
  const handleRenameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renameTarget) return;
    const newName = renameValue.trim();
    if (!newName) return;

    if (
      newName.toLowerCase() !== renameTarget.toLowerCase() &&
      categories.some((c) => c.toLowerCase() === newName.toLowerCase())
    ) {
      showToast(`Category "${newName}" already exists.`, "error");
      return;
    }

    setLoadingAction("rename");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          oldName: renameTarget,
          newName,
          updateProducts: syncProductsOnRename,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename category.");

      const updatedCats = data.storeCategories || categories.map((c) => (c === renameTarget ? newName : c));
      const updatedProducts = syncProductsOnRename
        ? productsList.map((p) =>
            p.category.toLowerCase() === renameTarget.toLowerCase() ? { ...p, category: newName } : p
          )
        : productsList;

      refreshLocalGroups(updatedCats, updatedProducts);
      showToast(data.message || `Renamed "${renameTarget}" to "${newName}".`);

      setRenameTarget(null);
      setRenameValue("");
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not rename category.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  // -------------------------------------------------------------
  // DELETE CATEGORY
  // -------------------------------------------------------------
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;

    setLoadingAction("delete");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deleteTarget,
          reassignTo: reassignCategoryOnDelete || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category.");

      const updatedCats = categories.filter((c) => c.toLowerCase() !== deleteTarget.toLowerCase());
      const updatedProducts = reassignCategoryOnDelete
        ? productsList.map((p) =>
            p.category.toLowerCase() === deleteTarget.toLowerCase()
              ? { ...p, category: reassignCategoryOnDelete }
              : p
          )
        : productsList;

      refreshLocalGroups(updatedCats, updatedProducts);
      showToast(data.message || `Category "${deleteTarget}" deleted.`);

      setDeleteTarget(null);
      setReassignCategoryOnDelete("");
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete category.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  // -------------------------------------------------------------
  // BULK REASSIGN PRODUCTS TO CATEGORY
  // -------------------------------------------------------------
  const handleAssignProductsSubmit = async () => {
    if (!assignModalCategory || selectedProductIdsToAssign.length === 0) return;

    setLoadingAction("reassign");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign",
          productIds: selectedProductIdsToAssign,
          targetCategory: assignModalCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign products.");

      const updatedProducts = productsList.map((p) =>
        selectedProductIdsToAssign.includes(p.id) ? { ...p, category: assignModalCategory } : p
      );

      refreshLocalGroups(categories, updatedProducts);
      showToast(`Assigned ${selectedProductIdsToAssign.length} product(s) to "${assignModalCategory}".`);

      setAssignModalCategory(null);
      setSelectedProductIdsToAssign([]);
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reassign products.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  // -------------------------------------------------------------
  // RESET DEFAULTS
  // -------------------------------------------------------------
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        "Reset categories back to defaults (Makhana, Nuts, Pantry)? Existing product assignments will remain untouched."
      )
    )
      return;

    setLoadingAction("reset");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset categories.");

      const defaultCats = data.storeCategories || ["Makhana", "Nuts", "Pantry"];
      refreshLocalGroups(defaultCats, productsList);
      showToast("Categories successfully reset back to defaults.");
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reset categories.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  // Quick Adopt Orphaned Category
  const handleAdoptOrphaned = async (orphanedName: string) => {
    setLoadingAction(`adopt-${orphanedName}`);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orphanedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category.");

      const updatedCats = data.storeCategories || [...categories, orphanedName];
      refreshLocalGroups(updatedCats, productsList);
      showToast(`Added "${orphanedName}" as an active storefront tab!`);
      startTransition(() => router.refresh());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not adopt category.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const totalCategorizedProducts = categoriesWithProducts.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-800 text-white border-emerald-700"
                : "bg-rose-700 text-white border-rose-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 transition-opacity"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/90 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
              <LayoutGrid size={22} />
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight">
              Category Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Control the storefront filter tabs, reorder how categories display to customers, assign products in bulk, and rename categories safely.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/products"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
          >
            <ExternalLink size={15} className="text-brand-green" />
            <span>Storefront View</span>
          </Link>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={loadingAction === "reset"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs md:text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={14} className={loadingAction === "reset" ? "animate-spin" : ""} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewCategoryName("");
              setSelectedProductIdsForNew([]);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:brightness-95 text-white text-xs md:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* METRIC STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            Active Tabs
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1 flex items-baseline gap-2">
            <span>{categories.length}</span>
            <span className="text-xs font-semibold text-emerald-600">+ &quot;All&quot; tab</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            Categorized Products
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1 flex items-baseline gap-2">
            <span>{totalCategorizedProducts}</span>
            <span className="text-xs font-semibold text-gray-500">
              of {productsList.length} total
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            Tab Reordering
          </div>
          <div className="text-2xl font-bold text-brand-green mt-1 flex items-center gap-1.5 text-base md:text-lg">
            <ArrowUpDown size={18} />
            <span>Interactive</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            Unlisted Categories
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              orphanedCategories.length > 0 ? "text-amber-600" : "text-emerald-700"
            }`}
          >
            {orphanedCategories.length}
          </div>
        </div>
      </div>

      {/* LIVE STOREFRONT FILTER BAR SIMULATOR */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-green" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Live Storefront Filter Bar Simulator
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            Click any tab below to test the storefront active tab indicator
          </span>
        </div>

        {/* Exact beige simulator box matching storefront style */}
        <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E9E4DC] shadow-inner">
          <div className="flex gap-4 sm:gap-6 items-center flex-wrap">
            {/* Always "All" */}
            <button
              type="button"
              onClick={() => setPreviewTab("all")}
              className={`font-medium transition-colors relative py-1 text-sm sm:text-base cursor-pointer ${
                previewTab === "all"
                  ? "text-brand-green font-bold"
                  : "text-brand-charcoal opacity-70 hover:text-brand-green"
              }`}
            >
              <span>All</span>
              {previewTab === "all" && (
                <motion.div
                  layoutId="adminCategorySimIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            {/* Configured Categories */}
            {categories.map((cat) => {
              const isSelected = previewTab.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPreviewTab(cat)}
                  className={`font-medium transition-colors relative py-1 text-sm sm:text-base cursor-pointer ${
                    isSelected
                      ? "text-brand-green font-bold"
                      : "text-brand-charcoal opacity-70 hover:text-brand-green"
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="adminCategorySimIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* Combo Badge */}
            {comboEnabled && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green bg-brand-pink/70 px-3 py-1 rounded-full border border-brand-pink-accent/40 shadow-2xs select-none">
                <span>🌸</span> Make a Combo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ORPHANED / UNCONFIGURED CATEGORIES ALERT BANNER */}
      {orphanedCategories.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                Found {orphanedCategories.length} Category Name(s) Not Shown on Storefront
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Some existing products in your catalog are assigned to categories that are not currently in your active filter tabs. Customers viewing your store cannot filter by these categories unless you add them to the bar.
              </p>

              <div className="mt-3 flex flex-wrap gap-2.5">
                {orphanedCategories.map((orphan) => (
                  <div
                    key={orphan.name}
                    className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-xs shadow-2xs font-semibold text-gray-800"
                  >
                    <span>
                      &quot;{orphan.name}&quot; ({orphan.count} product{orphan.count === 1 ? "" : "s"})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdoptOrphaned(orphan.name)}
                      disabled={loadingAction === `adopt-${orphan.name}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                      title="Add this category as an active storefront tab"
                    >
                      <Plus size={12} />
                      <span>Add as Tab</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT LIST */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Configured Store Categories</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Use the <span className="font-semibold text-gray-700">Up</span> and{" "}
              <span className="font-semibold text-gray-700">Down</span> arrows to change the order tabs appear on your store.
            </p>
          </div>

          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {categories.length} Categories configured
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
              <Layers size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">No categories created yet.</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Click &quot;Add Category&quot; above or click &quot;Reset Defaults&quot; to populate standard categories.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat, index) => {
              const group = categoriesWithProducts.find(
                (g) => g.name.toLowerCase() === cat.toLowerCase()
              );
              const productCount = group?.count ?? 0;
              const isExpanded = !!expandedCategories[cat];
              const isFirst = index === 0;
              const isLast = index === categories.length - 1;

              return (
                <div key={cat} className="transition-colors hover:bg-gray-50/50">
                  {/* Category Card Header */}
                  <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Position & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Order Buttons */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={isFirst || loadingAction !== null}
                          title={isFirst ? "First item" : "Move up in filter bar"}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-brand-pink/30 hover:border-brand-pink-accent/50 text-gray-600 hover:text-brand-green flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          <MoveUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={isLast || loadingAction !== null}
                          title={isLast ? "Last item" : "Move down in filter bar"}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-brand-pink/30 hover:border-brand-pink-accent/50 text-gray-600 hover:text-brand-green flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          <MoveDown size={13} />
                        </button>
                      </div>

                      {/* Index Badge */}
                      <span className="w-6 text-center text-xs font-bold text-gray-400">
                        #{index + 1}
                      </span>

                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                        <Tag size={18} />
                      </div>

                      {/* Titles */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-gray-900 truncate">{cat}</h3>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {productCount} product{productCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                          <span>Filter slug:</span>
                          <code className="text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded font-mono">
                            /products?category={encodeURIComponent(cat.toLowerCase())}
                          </code>
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                      {/* View Products Accordion Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isExpanded
                            ? "bg-gray-100 text-gray-900 border-gray-300"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-2xs"
                        }`}
                      >
                        <Package size={14} className="text-brand-green" />
                        <span>Products ({productCount})</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {/* Assign Products Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalCategory(cat);
                          setAssignSearch("");
                          setSelectedProductIdsToAssign([]);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-brand-pink/20 hover:text-brand-green hover:border-brand-pink-accent/40 shadow-2xs transition-all cursor-pointer"
                        title="Bulk assign products to this category"
                      >
                        <Plus size={13} />
                        <span>Assign Products</span>
                      </button>

                      {/* Rename Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget(cat);
                          setRenameValue(cat);
                          setSyncProductsOnRename(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer"
                        title="Rename category"
                      >
                        <Edit3 size={13} />
                        <span>Rename</span>
                      </button>

                      {/* View on Storefront Link */}
                      <Link
                        href={`/products?category=${encodeURIComponent(cat.toLowerCase())}`}
                        target="_blank"
                        className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-brand-green flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Open storefront with this category active"
                      >
                        <ExternalLink size={14} />
                      </Link>

                      {/* Delete Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(cat);
                          // Default reassign target to another existing category if available
                          const other = categories.find((c) => c !== cat) || "";
                          setReassignCategoryOnDelete(other);
                        }}
                        className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-400 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title={`Delete ${cat}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* EXPANDABLE PRODUCTS DRAWER */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 bg-gray-50/70 p-4 md:p-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Products in &quot;{cat}&quot; ({productCount})
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalCategory(cat);
                                setAssignSearch("");
                                setSelectedProductIdsToAssign([]);
                              }}
                              className="text-xs font-bold text-brand-green hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={13} /> Add more products to this category
                            </button>
                          </div>

                          {(!group?.products || group.products.length === 0) ? (
                            <div className="p-6 text-center bg-white rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
                              No products assigned to this category yet. Click &quot;Assign Products&quot; above to add items.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {group.products.map((p) => (
                                <div
                                  key={p.id}
                                  className="bg-white rounded-xl border border-gray-200/80 p-3 flex items-center gap-3 shadow-2xs hover:border-gray-300 transition-all"
                                >
                                  <div className="w-12 h-12 rounded-lg bg-gray-50 relative overflow-hidden shrink-0 border border-gray-100">
                                    {p.imageUrl ? (
                                      <Image
                                        src={p.imageUrl}
                                        alt={p.name}
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Package size={18} />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-900 truncate">
                                      {p.name}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                      {formatPrice(p.basePrice)} • SKU: {p.sku}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                          p.isAvailable && p.stockQuantity > 0
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-rose-50 text-rose-700"
                                        }`}
                                      >
                                        {p.isAvailable && p.stockQuantity > 0
                                          ? `${p.stockQuantity} in stock`
                                          : "Out of Stock"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW CATEGORY                                 */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Add New Category</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Roasted Makhana, Gourmet Seeds, Pantry"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm"
                    autoFocus
                  />
                </div>

                {/* Suggested Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">Popular Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Roasted Makhana",
                      "Gourmet Snacks",
                      "Seeds & Berries",
                      "Everyday Essentials",
                      "Healthy Sips",
                      "Gift Boxes",
                    ]
                      .filter((s) => !categories.some((c) => c.toLowerCase() === s.toLowerCase()))
                      .map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => setNewCategoryName(suggested)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                        >
                          + {suggested}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Optional Product Assignment */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      Assign Products Immediately (Optional)
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {selectedProductIdsForNew.length} selected
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-2 bg-gray-50/50">
                    {productsList.map((p) => {
                      const isChecked = selectedProductIdsForNew.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIdsForNew([...selectedProductIdsForNew, p.id]);
                              } else {
                                setSelectedProductIdsForNew(
                                  selectedProductIdsForNew.filter((id) => id !== p.id)
                                );
                              }
                            }}
                            className="rounded text-brand-green focus:ring-brand-green/20"
                          />
                          <span className="font-semibold text-gray-800 truncate flex-1">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Currently: {p.category || "None"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim() || loadingAction === "add"}
                    className="px-5 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold shadow-xs hover:brightness-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingAction === "add" ? "Creating..." : "Create Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 2: RENAME CATEGORY                                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {renameTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenameTarget(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Edit3 size={16} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Rename Category</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">New Name</label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm"
                    autoFocus
                  />
                </div>

                <div className="p-3 bg-brand-pink/20 rounded-xl border border-brand-pink-accent/40 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncProductsOnRename}
                      onChange={(e) => setSyncProductsOnRename(e.target.checked)}
                      className="mt-0.5 rounded text-brand-green focus:ring-brand-green/20"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-800">
                        Update all existing products in database
                      </span>
                      <p className="text-gray-500 mt-0.5">
                        Automatically update all products currently labeled &quot;{renameTarget}&quot; to use &quot;{renameValue}&quot; so no products get lost.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setRenameTarget(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!renameValue.trim() || loadingAction === "rename"}
                    className="px-5 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold shadow-xs hover:brightness-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingAction === "rename" ? "Saving..." : "Save Name"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CATEGORY WITH PRODUCT MIGRATION           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Trash2 size={16} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Delete Category</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove <strong className="text-gray-900">&quot;{deleteTarget}&quot;</strong> from your active storefront category tabs?
                </p>

                {(() => {
                  const targetGroup = categoriesWithProducts.find(
                    (g) => g.name.toLowerCase() === deleteTarget.toLowerCase()
                  );
                  const affectedCount = targetGroup?.count ?? 0;
                  const otherCategories = categories.filter(
                    (c) => c.toLowerCase() !== deleteTarget.toLowerCase()
                  );

                  if (affectedCount === 0) {
                    return (
                      <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        ✦ There are currently 0 products assigned to this category. Safe to delete.
                      </p>
                    );
                  }

                  return (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-amber-900">
                          {affectedCount} product{affectedCount === 1 ? "" : "s"} currently in &quot;{deleteTarget}&quot;
                        </span>
                      </div>
                      <p className="text-xs text-amber-800">
                        Choose what should happen to these products:
                      </p>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-amber-900 uppercase">
                          Reassign affected products to:
                        </label>
                        <select
                          value={reassignCategoryOnDelete}
                          onChange={(e) => setReassignCategoryOnDelete(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-brand-green cursor-pointer"
                        >
                          <option value="">Do not reassign (Leave category as-is)</option>
                          {otherCategories.map((c) => (
                            <option key={c} value={c}>
                              Move to &quot;{c}&quot;
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={loadingAction === "delete"}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loadingAction === "delete" ? "Deleting..." : "Delete Category"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 4: BULK ASSIGN PRODUCTS                             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {assignModalCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignModalCategory(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4 z-10 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">
                      Assign Products to &quot;{assignModalCategory}&quot;
                    </h3>
                    <p className="text-xs text-gray-500">
                      Select products below to move them into this category.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignModalCategory(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search products by title or SKU..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-brand-green focus:ring-2 focus:ring-brand-green/15"
                />
              </div>

              {/* Products Checklist */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl p-1 bg-gray-50/50">
                {productsList
                  .filter((p) => {
                    const q = assignSearch.toLowerCase();
                    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                  })
                  .map((p) => {
                    const isAlreadyIn =
                      p.category?.toLowerCase() === assignModalCategory.toLowerCase();
                    const isChecked = selectedProductIdsToAssign.includes(p.id);

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer text-xs ${
                          isAlreadyIn
                            ? "bg-emerald-50/50 opacity-80"
                            : isChecked
                            ? "bg-white font-medium shadow-2xs"
                            : "hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || isAlreadyIn}
                          disabled={isAlreadyIn}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIdsToAssign([...selectedProductIdsToAssign, p.id]);
                            } else {
                              setSelectedProductIdsToAssign(
                                selectedProductIdsToAssign.filter((id) => id !== p.id)
                              );
                            }
                          }}
                          className="rounded text-brand-green focus:ring-brand-green/20"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-500">
                            SKU: {p.sku} • {formatPrice(p.basePrice)}
                          </p>
                        </div>
                        <div>
                          {isAlreadyIn ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Already here
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              In {p.category || "Unassigned"}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
                <span className="text-xs font-semibold text-gray-500">
                  {selectedProductIdsToAssign.length} product(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalCategory(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignProductsSubmit}
                    disabled={selectedProductIdsToAssign.length === 0 || loadingAction === "reassign"}
                    className="px-5 py-2 rounded-xl bg-brand-green text-white text-xs font-bold shadow-xs hover:brightness-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingAction === "reassign" ? "Saving..." : "Move to Category"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
