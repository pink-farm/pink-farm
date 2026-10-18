"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, X, Sparkles } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

export interface EditableProduct {
  id: string; name: string; slug: string; shortDescription: string; description: string; imageUrl: string | null;
  basePrice: number; originalPrice: number | null; sku: string; category: string; stockQuantity: number;
  lowStockThreshold: number; isAvailable: boolean; isFeatured: boolean; ingredients?: string | null;
  nutritionalInfo?: string | null; storage?: string | null; allergens?: string | null; deliveryNotes?: string | null;
  seoTitle?: string | null; seoDesc?: string | null; tags?: string;
  highlights?: string | null;
  variants: { id: string; name: string; packSize: string; price: number; originalPrice: number | null; stockQuantity: number; isAvailable: boolean }[];
}

const inputClass = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-green";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600";

export function ProductFormModal({ product, onClose, onSaved, onDeleted }: { product: EditableProduct | null; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const storeCategories = useSettingsStore((s) => s.storeCategories);
  const activeCategories = useMemo(
    () => Array.isArray(storeCategories) && storeCategories.length > 0
      ? storeCategories
      : ["Makhana", "Nuts", "Pantry"],
    [storeCategories]
  );
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Populate editable form state when the modal opens or the selected product changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!product) {
      setValues({
        name: "",
        slug: "",
        shortDescription: "",
        description: "",
        highlights: "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — Rich in wholesome nutrients\nNo Artificial Colours, Just Authentic Seasonings!",
        basePrice: "",
        originalPrice: "",
        sku: "",
        category: activeCategories[0] || "Makhana",
        stockQuantity: "0",
        lowStockThreshold: "5",
        packSize: "Standard",
        ingredients: "",
        nutritionalInfo: "",
        storage: "",
        allergens: "",
        deliveryNotes: "",
        seoTitle: "",
        seoDesc: "",
        tags: "",
        isFeatured: false,
        isAvailable: true,
      });
      setIsCustomCategory(false);
      setImageUrl("");
      return;
    }
    let tags = "";
    try { tags = JSON.parse(product.tags || "[]").join(", "); } catch { tags = ""; }

    const defaultHighlights = (() => {
      const isMakhana = product.category?.toLowerCase().includes("makhana") || product.slug?.includes("makhana");
      const isNuts = product.category?.toLowerCase().includes("nut") || product.slug?.includes("almond") || product.slug?.includes("cashew");
      if (isMakhana) {
        return "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.4 g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!";
      }
      if (isNuts) {
        return "Plant Protein — High-quality plant protein & dietary fibre\nZero added palm oil & zero trans fats\nRich in Vitamin E, Magnesium & antioxidant nutrients\nVacuum packed for maximum fresh crunch";
      }
      return "Pure Plant Goodness — Clean label with zero preservatives\nPrepared using authentic, traditional processing methods\nSourced ethically directly from farm origin";
    })();

    const prodCategory = product.category || "Makhana";
    setIsCustomCategory(!activeCategories.some((c) => c.toLowerCase() === prodCategory.toLowerCase()));

    setValues({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      highlights: product.highlights || defaultHighlights,
      basePrice: String(product.basePrice / 100),
      originalPrice: product.originalPrice == null ? "" : String(product.originalPrice / 100),
      sku: product.sku,
      category: prodCategory,
      stockQuantity: String(product.variants?.[0]?.stockQuantity ?? product.stockQuantity),
      lowStockThreshold: String(product.lowStockThreshold),
      packSize: product.variants?.[0]?.packSize ?? "Standard",
      ingredients: product.ingredients ?? "",
      nutritionalInfo: product.nutritionalInfo ?? "",
      storage: product.storage ?? "",
      allergens: product.allergens ?? "",
      deliveryNotes: product.deliveryNotes ?? "",
      seoTitle: product.seoTitle ?? "",
      seoDesc: product.seoDesc ?? "",
      tags,
      isFeatured: product.isFeatured,
      isAvailable: product.isAvailable,
    });
    setImageUrl(product.imageUrl ?? "");
  }, [product, activeCategories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (product === undefined) return null;
  const set = (key: string, value: string | boolean) => setValues((prev) => ({ ...prev, [key]: value }));
  const field = (key: string) => String(values[key] ?? "");

  async function chooseImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new globalThis.Image();
      image.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.78);
        if (compressed.length > 3_500_000) { setError("This image is too large after compression. Choose a smaller image."); return; }
        setImageUrl(compressed); setError("");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");

    if (!imageUrl.trim()) {
      setError("Please select or paste an image for the product.");
      setSaving(false);
      return;
    }

    const basePriceNum = Number(values.basePrice);
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      setError("Selling price must be greater than ₹0.");
      setSaving(false);
      return;
    }

    if (field("originalPrice")) {
      const origPriceNum = Number(values.originalPrice);
      if (isNaN(origPriceNum) || origPriceNum <= 0) {
        setError("Original MRP must be greater than ₹0.");
        setSaving(false);
        return;
      }
      if (origPriceNum < basePriceNum) {
        setError("Original MRP cannot be less than selling price.");
        setSaving(false);
        return;
      }
    }

    const payload = {
      ...values,
      imageUrl,
      basePrice: Math.round(Number(values.basePrice) * 100),
      originalPrice: field("originalPrice") ? Math.round(Number(values.originalPrice) * 100) : null,
      stockQuantity: Math.max(0, Math.floor(Number(values.stockQuantity) || 0)),
      lowStockThreshold: Math.max(0, Math.floor(Number(values.lowStockThreshold) || 0)),
      slug: field("slug") || field("name").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    };
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save product.");

      // If category is new, update useSettingsStore immediately so UI reflects it everywhere
      const enteredCat = field("category").trim();
      if (enteredCat && !activeCategories.some((c) => c.toLowerCase() === enteredCat.toLowerCase())) {
        useSettingsStore.getState().setSettings({
          storeCategories: [...activeCategories, enteredCat],
        });
      }

      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save product."); }
    finally { setSaving(false); }
  }

  async function deleteProduct() {
    if (!product || !window.confirm(`Permanently delete “${product.name}”? This cannot be undone.`)) return;
    setDeleting(true); setError("");
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete product.");
      onDeleted();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete product."); }
    finally { setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={save} className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7"><div><h2 className="text-xl font-bold text-gray-900">{product ? "Edit product" : "Add new product"}</h2><p className="mt-1 text-xs text-gray-500">Add the product details and available inventory.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button></header>
        {error && (
          <div role="alert" className="mx-5 sm:mx-7 mt-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded">✕</button>
          </div>
        )}
        <div className="grid gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-7">
          <label className="sm:col-span-2"><span className={labelClass}>Product image *</span><div className="flex items-center gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">{imageUrl ? <Image src={imageUrl} alt="Product preview" width={96} height={96} unoptimized className="h-full w-full object-cover" /> : <ImagePlus className="text-gray-400" />}</div><div className="flex-1 space-y-2"><input type="file" accept="image/*" onChange={(event) => void chooseImage(event.target.files?.[0])} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold"/><input value={imageUrl.startsWith("data:") ? "" : imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Or paste an image URL" className={inputClass} /></div></div></label>
          <label><span className={labelClass}>Product name *</span><input required value={field("name")} onChange={(e) => { set("name", e.target.value); if (!product) set("slug", e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className={inputClass}/></label>
          <label><span className={labelClass}>SKU *</span><input required value={field("sku")} onChange={(e) => set("sku", e.target.value)} className={inputClass}/></label>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="prodCategorySelect" className="block text-xs font-semibold text-gray-600">Category *</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (isCustomCategory) {
                    set("category", activeCategories[0] || "Makhana");
                  }
                }}
                className="text-[11px] font-semibold text-brand-green hover:underline cursor-pointer"
              >
                {isCustomCategory ? "← Choose existing" : "+ Add new category"}
              </button>
            </div>
            {isCustomCategory ? (
              <input
                required
                placeholder="Type new category (e.g. Gourmet Snacks)"
                value={field("category")}
                onChange={(e) => set("category", e.target.value)}
                className={inputClass}
              />
            ) : (
              <select
                id="prodCategorySelect"
                required
                value={field("category")}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setIsCustomCategory(true);
                    set("category", "");
                  } else {
                    set("category", e.target.value);
                  }
                }}
                className={inputClass}
              >
                {activeCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {!activeCategories.some((c) => c.toLowerCase() === field("category").toLowerCase()) && field("category") && (
                  <option value={field("category")}>{field("category")}</option>
                )}
                <option value="__new__">+ Add new category...</option>
              </select>
            )}
          </div>
          <label><span className={labelClass}>Slug *</span><input required value={field("slug")} onChange={(e) => set("slug", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Price (₹) *</span><input required min="0" step="0.01" type="number" value={field("basePrice")} onChange={(e) => set("basePrice", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Original price (₹)</span><input min="0" step="0.01" type="number" value={field("originalPrice")} onChange={(e) => set("originalPrice", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Inventory quantity *</span><input required min="0" step="1" type="number" value={field("stockQuantity")} onChange={(e) => set("stockQuantity", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Pack size</span><input value={field("packSize")} onChange={(e) => set("packSize", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Low stock alert at</span><input min="0" step="1" type="number" value={field("lowStockThreshold")} onChange={(e) => set("lowStockThreshold", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Short description</span><input value={field("shortDescription")} onChange={(e) => set("shortDescription", e.target.value)} className={inputClass}/></label>
          <label className="sm:col-span-2"><span className={labelClass}>Full description</span><textarea rows={3} value={field("description")} onChange={(e) => set("description", e.target.value)} className={inputClass}/></label>

          {/* WHY YOU'LL LOVE THIS / PRODUCT HIGHLIGHTS */}
          <div className="sm:col-span-2 rounded-2xl border border-pink-200/80 bg-gradient-to-b from-pink-50/40 to-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-pink-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    &quot;Why You&apos;ll Love This&quot; Highlights
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Shown directly below the product title on the product detail page. Put each bullet point on a new line.
                  </p>
                </div>
              </div>

              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "highlights",
                      "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.4 g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!"
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-pink-100/60 border border-pink-200 text-brand-green transition-colors cursor-pointer"
                >
                  Makhana Template
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "highlights",
                      "Plant Protein — High-quality plant protein & dietary fibre\nZero added palm oil & zero trans fats\nRich in Vitamin E, Magnesium & antioxidant nutrients\nVacuum packed for maximum fresh crunch"
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-pink-100/60 border border-pink-200 text-brand-green transition-colors cursor-pointer"
                >
                  Nuts Template
                </button>
                <button
                  type="button"
                  onClick={() => set("highlights", "")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
              <div className="space-y-1.5">
                <span className={labelClass}>Highlight Bullet Points (1 per line)</span>
                <textarea
                  rows={4}
                  value={field("highlights")}
                  onChange={(e) => set("highlights", e.target.value)}
                  placeholder={`0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.4 g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!`}
                  className={`${inputClass} font-mono text-xs leading-relaxed`}
                />
              </div>

              {/* Real-time Visual Preview identical to storefront */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-gray-500">Live Customer Storefront Preview</span>
                <div className="bg-brand-pink/50 border border-brand-pink-accent/40 rounded-xl p-3 space-y-1 shadow-2xs min-h-[110px]">
                  <div className="text-[11px] font-bold text-brand-green uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brand-green" /> Why You&apos;ll Love This
                  </div>
                  <ul className="space-y-1 text-xs text-brand-charcoal/85 leading-snug">
                    {field("highlights")
                      .split("\n")
                      .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
                      .filter(Boolean).length > 0 ? (
                      field("highlights")
                        .split("\n")
                        .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
                        .filter(Boolean)
                        .map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))
                    ) : (
                      <li className="text-[11px] text-gray-400 italic">
                        Type bullet points on the left to see live preview...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <label><span className={labelClass}>Ingredients</span><input value={field("ingredients")} onChange={(e) => set("ingredients", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Nutrition information</span><input value={field("nutritionalInfo")} onChange={(e) => set("nutritionalInfo", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Storage instructions</span><input value={field("storage")} onChange={(e) => set("storage", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Allergens</span><input value={field("allergens")} onChange={(e) => set("allergens", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Delivery notes</span><input value={field("deliveryNotes")} onChange={(e) => set("deliveryNotes", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Tags (comma separated)</span><input value={field("tags")} onChange={(e) => set("tags", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>SEO title</span><input value={field("seoTitle")} onChange={(e) => set("seoTitle", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>SEO description</span><input value={field("seoDesc")} onChange={(e) => set("seoDesc", e.target.value)} className={inputClass}/></label>
          <div className="flex flex-wrap gap-5 sm:col-span-2"><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={Boolean(values.isFeatured)} onChange={(e) => set("isFeatured", e.target.checked)} className="accent-emerald-700"/> Feature on storefront</label><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={Boolean(values.isAvailable)} onChange={(e) => set("isAvailable", e.target.checked)} className="accent-emerald-700"/> Available to purchase</label></div>
        </div>
        <footer className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:px-7">
          <div>
            {product && (
              <button
                type="button"
                onClick={() => void deleteProduct()}
                disabled={deleting || saving}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>Delete product</span>
              </button>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || deleting || !imageUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-2 text-sm font-semibold text-white hover:bg-brand-green/90 disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {product ? "Save changes" : "Create product"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
