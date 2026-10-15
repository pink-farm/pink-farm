"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";

export interface EditableProduct {
  id: string; name: string; slug: string; shortDescription: string; description: string; imageUrl: string | null;
  basePrice: number; originalPrice: number | null; sku: string; category: string; stockQuantity: number;
  lowStockThreshold: number; isAvailable: boolean; isFeatured: boolean; ingredients?: string | null;
  nutritionalInfo?: string | null; storage?: string | null; allergens?: string | null; deliveryNotes?: string | null;
  seoTitle?: string | null; seoDesc?: string | null; tags?: string; variants: { packSize: string }[];
}

const inputClass = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-green";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600";

export function ProductFormModal({ product, onClose, onSaved, onDeleted }: { product: EditableProduct | null; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product) {
      setValues({ name: "", slug: "", shortDescription: "", description: "", basePrice: "", originalPrice: "", sku: "", category: "Makhana", stockQuantity: "0", lowStockThreshold: "5", packSize: "Standard", ingredients: "", nutritionalInfo: "", storage: "", allergens: "", deliveryNotes: "", seoTitle: "", seoDesc: "", tags: "", isFeatured: false, isAvailable: true });
      setImageUrl(""); return;
    }
    let tags = ""; try { tags = JSON.parse(product.tags || "[]").join(", "); } catch { tags = ""; }
    setValues({ name: product.name, slug: product.slug, shortDescription: product.shortDescription, description: product.description, basePrice: String(product.basePrice / 100), originalPrice: product.originalPrice == null ? "" : String(product.originalPrice / 100), sku: product.sku, category: product.category, stockQuantity: String(product.variants?.[0]?.stockQuantity ?? product.stockQuantity), lowStockThreshold: String(product.lowStockThreshold), packSize: product.variants?.[0]?.packSize ?? "Standard", ingredients: product.ingredients ?? "", nutritionalInfo: product.nutritionalInfo ?? "", storage: product.storage ?? "", allergens: product.allergens ?? "", deliveryNotes: product.deliveryNotes ?? "", seoTitle: product.seoTitle ?? "", seoDesc: product.seoDesc ?? "", tags, isFeatured: product.isFeatured, isAvailable: product.isAvailable });
    setImageUrl(product.imageUrl ?? "");
  }, [product]);

  if (product === undefined) return null;
  const set = (key: string, value: string | boolean) => setValues((prev) => ({ ...prev, [key]: value }));
  const field = (key: string) => String(values[key] ?? "");

  async function chooseImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
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
    const payload = { ...values, imageUrl, basePrice: Math.round(Number(values.basePrice) * 100), originalPrice: field("originalPrice") ? Math.round(Number(values.originalPrice) * 100) : null, stockQuantity: Number(values.stockQuantity), lowStockThreshold: Number(values.lowStockThreshold), slug: field("slug") || field("name").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", { method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save product.");
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
        <div className="grid gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-7">
          <label className="sm:col-span-2"><span className={labelClass}>Product image *</span><div className="flex items-center gap-4"><div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">{imageUrl ? <img src={imageUrl} alt="Product preview" className="h-full w-full object-cover" /> : <ImagePlus className="text-gray-400" />}</div><div className="flex-1 space-y-2"><input type="file" accept="image/*" onChange={(event) => void chooseImage(event.target.files?.[0])} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold"/><input value={imageUrl.startsWith("data:") ? "" : imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Or paste an image URL" className={inputClass} /></div></div></label>
          <label><span className={labelClass}>Product name *</span><input required value={field("name")} onChange={(e) => { set("name", e.target.value); if (!product) set("slug", e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className={inputClass}/></label>
          <label><span className={labelClass}>SKU *</span><input required value={field("sku")} onChange={(e) => set("sku", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Category *</span><input required value={field("category")} onChange={(e) => set("category", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Slug *</span><input required value={field("slug")} onChange={(e) => set("slug", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Price (₹) *</span><input required min="0" step="0.01" type="number" value={field("basePrice")} onChange={(e) => set("basePrice", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Original price (₹)</span><input min="0" step="0.01" type="number" value={field("originalPrice")} onChange={(e) => set("originalPrice", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Inventory quantity *</span><input required min="0" step="1" type="number" value={field("stockQuantity")} onChange={(e) => set("stockQuantity", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Pack size</span><input value={field("packSize")} onChange={(e) => set("packSize", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Low stock alert at</span><input min="0" step="1" type="number" value={field("lowStockThreshold")} onChange={(e) => set("lowStockThreshold", e.target.value)} className={inputClass}/></label>
          <label><span className={labelClass}>Short description</span><input value={field("shortDescription")} onChange={(e) => set("shortDescription", e.target.value)} className={inputClass}/></label>
          <label className="sm:col-span-2"><span className={labelClass}>Full description</span><textarea rows={3} value={field("description")} onChange={(e) => set("description", e.target.value)} className={inputClass}/></label>
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
        <footer className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:px-7"><div className="min-w-0">{error ? <p className="text-sm text-rose-700">{error}</p> : product ? <button type="button" onClick={() => void deleteProduct()} disabled={deleting || saving} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{deleting ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>} Delete product</button> : <span/>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button><button disabled={saving || deleting || !imageUrl} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}{product ? "Save changes" : "Create product"}</button></div></footer>
      </form>
    </div>
  );
}
