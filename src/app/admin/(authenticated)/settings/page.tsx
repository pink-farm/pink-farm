"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Store,
  Bell,
  Truck,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Power,
  ImagePlus,
  Video,
  Upload,
  RotateCcw,
  TicketPercent,
  Trash2,
  Pencil,
  Wand2,
  LayoutGrid,
  HeartHandshake,
  ArrowRight,
  Sliders,
  Check,
  Package,
  Plus,
  Tag,
} from "lucide-react";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/store/settingsStore";
import { FALLBACK_PRODUCTS, type StoreProduct } from "@/lib/defaultProducts";

type Coupon = {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  minimumSubtotal: number;
  maximumDiscount: number | null;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
};

type CouponDraft = {
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: string;
  minimumSubtotal: string;
  maximumDiscount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  firstOrderOnly: boolean;
  isActive: boolean;
};

type SettingsTab = "products" | "combo" | "categories" | "store" | "operations" | "founder" | "coupons" | "all";

function toLocalDateTimeInput(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const emptyCoupon: CouponDraft = {
  code: "",
  discountType: "FIXED",
  discountValue: "",
  minimumSubtotal: "0",
  maximumDiscount: "",
  startsAt: toLocalDateTimeInput(new Date()),
  expiresAt: "",
  usageLimit: "",
  perCustomerLimit: "",
  firstOrderOnly: false,
  isActive: true,
};

async function compressHeroImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new globalThis.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This image could not be opened."));
      image.src = sourceUrl;
    });

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 900 / Math.max(image.width, image.height));
    let width = Math.max(1, Math.round(image.width * scale));
    let height = Math.max(1, Math.round(image.height * scale));
    let quality = 0.82;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not process this image.");
      context.drawImage(image, 0, 0, width, height);

      let compressed = canvas.toDataURL("image/webp", quality);
      if (!compressed.startsWith("data:image/webp")) {
        compressed = canvas.toDataURL("image/jpeg", quality);
      }
      if (compressed.length <= 700_000) return compressed;

      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
      quality = Math.max(0.45, quality - 0.06);
    }

    throw new Error("This image is too large to save. Choose a smaller photo and try again.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export default function StoreSettingsPage() {
  const storeSettings = useSettingsStore();
  const prefersReducedMotion = useReducedMotion();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<SettingsTab>("products");

  // Store & Announcements
  const [storeName, setStoreName] = useState(DEFAULT_SETTINGS.storeName);
  const [announcementText, setAnnouncementText] = useState(DEFAULT_SETTINGS.announcementText);
  const [bottomAnnouncementText, setBottomAnnouncementText] = useState(DEFAULT_SETTINGS.bottomAnnouncementText);
  const [bottomAnnouncementEnabled, setBottomAnnouncementEnabled] = useState(DEFAULT_SETTINGS.bottomAnnouncementEnabled);

  // Floating bubble images
  const [heroMainImage, setHeroMainImage] = useState(DEFAULT_SETTINGS.heroMainImage);
  const [heroGheeImage, setHeroGheeImage] = useState(DEFAULT_SETTINGS.heroGheeImage);
  const [heroAlmondsImage, setHeroAlmondsImage] = useState(DEFAULT_SETTINGS.heroAlmondsImage);
  const [heroVideo, setHeroVideo] = useState(DEFAULT_SETTINGS.heroVideo);
  const [heroVideoOpacity, setHeroVideoOpacity] = useState(DEFAULT_SETTINGS.heroVideoOpacity);

  // Product List from API
  const [products, setProducts] = useState<StoreProduct[]>([]);

  // Heart Product Spotlight
  const [heartProductId, setHeartProductId] = useState(DEFAULT_SETTINGS.heartProductId);
  const [heartProductTitle, setHeartProductTitle] = useState(DEFAULT_SETTINGS.heartProductTitle);
  const [heartProductTagline, setHeartProductTagline] = useState(DEFAULT_SETTINGS.heartProductTagline);
  const [heartProductFeaturesText, setHeartProductFeaturesText] = useState(
    DEFAULT_SETTINGS.heartProductFeatures.join("\n")
  );
  const [heartProductButtonText, setHeartProductButtonText] = useState(
    DEFAULT_SETTINGS.heartProductButtonText
  );
  const [heartProductButtonUrl, setHeartProductButtonUrl] = useState(
    DEFAULT_SETTINGS.heartProductButtonUrl
  );
  const [heartProductSubtitle, setHeartProductSubtitle] = useState(
    DEFAULT_SETTINGS.heartProductSubtitle
  );
  const [heartProductImage, setHeartProductImage] = useState(DEFAULT_SETTINGS.heartProductImage);

  // Homepage Featured Product
  const [featuredProductId, setFeaturedProductId] = useState(DEFAULT_SETTINGS.featuredProductId);
  const [featuredProductHeading, setFeaturedProductHeading] = useState(
    DEFAULT_SETTINGS.featuredProductHeading
  );
  const [featuredProductDescription, setFeaturedProductDescription] = useState(
    DEFAULT_SETTINGS.featuredProductDescription
  );
  const [featuredProductImage, setFeaturedProductImage] = useState(
    DEFAULT_SETTINGS.featuredProductImage
  );
  const [featuredProductButtonText, setFeaturedProductButtonText] = useState(
    DEFAULT_SETTINGS.featuredProductButtonText
  );

  // Founder Story
  const [founderName, setFounderName] = useState(DEFAULT_SETTINGS.founderName);
  const [founderImage, setFounderImage] = useState(DEFAULT_SETTINGS.founderImage);
  const [founderRole, setFounderRole] = useState(DEFAULT_SETTINGS.founderRole);
  const [founderStoryFirst, setFounderStoryFirst] = useState(DEFAULT_SETTINGS.founderStoryFirst);
  const [founderStorySecond, setFounderStorySecond] = useState(DEFAULT_SETTINGS.founderStorySecond);
  const [founderQuote, setFounderQuote] = useState(DEFAULT_SETTINGS.founderQuote);
  const [founderTagsText, setFounderTagsText] = useState(DEFAULT_SETTINGS.founderTags.join("\n"));

  // Customer Support & Shipping
  const [supportPhone, setSupportPhone] = useState(DEFAULT_SETTINGS.supportPhone);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SETTINGS.supportEmail);
  const [businessAddress, setBusinessAddress] = useState(DEFAULT_SETTINGS.businessAddress);
  const [fssaiNumber, setFssaiNumber] = useState(DEFAULT_SETTINGS.fssaiNumber || "22126026000144");
  const [deliveryFeeRupees, setDeliveryFeeRupees] = useState("50");
  const [freeThresholdRupees, setFreeThresholdRupees] = useState("500");
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  // Combo Builder Settings
  const [comboEnabled, setComboEnabled] = useState(DEFAULT_SETTINGS.comboEnabled);
  const [comboEyebrow, setComboEyebrow] = useState(DEFAULT_SETTINGS.comboEyebrow);
  const [comboTitlePrefix, setComboTitlePrefix] = useState(DEFAULT_SETTINGS.comboTitlePrefix);
  const [comboTitleHighlight, setComboTitleHighlight] = useState(DEFAULT_SETTINGS.comboTitleHighlight);
  const [comboSubtitle, setComboSubtitle] = useState(DEFAULT_SETTINGS.comboSubtitle);
  const [comboTier1Count, setComboTier1Count] = useState(String(DEFAULT_SETTINGS.comboTier1Count));
  const [comboTier1Discount, setComboTier1Discount] = useState(String(DEFAULT_SETTINGS.comboTier1Discount));
  const [comboTier1Label, setComboTier1Label] = useState(DEFAULT_SETTINGS.comboTier1Label);
  const [comboTier1Tagline, setComboTier1Tagline] = useState(DEFAULT_SETTINGS.comboTier1Tagline);
  const [comboTier1Badge, setComboTier1Badge] = useState(DEFAULT_SETTINGS.comboTier1Badge);
  const [comboTier1Emoji, setComboTier1Emoji] = useState(DEFAULT_SETTINGS.comboTier1Emoji);
  const [comboTier2Count, setComboTier2Count] = useState(String(DEFAULT_SETTINGS.comboTier2Count));
  const [comboTier2Discount, setComboTier2Discount] = useState(String(DEFAULT_SETTINGS.comboTier2Discount));
  const [comboTier2Label, setComboTier2Label] = useState(DEFAULT_SETTINGS.comboTier2Label);
  const [comboTier2Tagline, setComboTier2Tagline] = useState(DEFAULT_SETTINGS.comboTier2Tagline);
  const [comboTier2Badge, setComboTier2Badge] = useState(DEFAULT_SETTINGS.comboTier2Badge);
  const [comboTier2Emoji, setComboTier2Emoji] = useState(DEFAULT_SETTINGS.comboTier2Emoji);
  const [comboButtonText, setComboButtonText] = useState(DEFAULT_SETTINGS.comboButtonText);
  const [comboFooterNote, setComboFooterNote] = useState(DEFAULT_SETTINGS.comboFooterNote);
  const [comboProductIds, setComboProductIds] = useState<string[]>(DEFAULT_SETTINGS.comboProductIds);
  const [storeCategories, setStoreCategories] = useState<string[]>(DEFAULT_SETTINGS.storeCategories);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [previewCategoryTab, setPreviewCategoryTab] = useState("all");
  const [previewTierTab, setPreviewTierTab] = useState<0 | 1>(0);

  const handleAddCategory = async (rawName?: string) => {
    const nameToAdd = (rawName || newCategoryInput).trim();
    if (!nameToAdd) return;
    if (storeCategories.some((c) => c.toLowerCase() === nameToAdd.toLowerCase())) {
      alert(`Category "${nameToAdd}" is already in your categories list.`);
      return;
    }
    const updated = [...storeCategories, nameToAdd];
    setStoreCategories(updated);
    setNewCategoryInput("");
    useSettingsStore.getState().setSettings({ storeCategories: updated });

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameToAdd }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.storeCategories)) {
        setStoreCategories(data.storeCategories);
        useSettingsStore.getState().setSettings({ storeCategories: data.storeCategories });
      }
    } catch (err) {
      console.warn("Could not immediately sync category:", err);
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const prodCount = products.filter(
      (p) => p.category?.toLowerCase() === catToDelete.toLowerCase()
    ).length;

    const message =
      prodCount > 0
        ? `"${catToDelete}" has ${prodCount} product${prodCount === 1 ? "" : "s"} assigned to it.\n\nDeleting it will remove the "${catToDelete}" tab from the storefront filter bar. (The products will still be available under the "All" tab).\n\nAre you sure you want to delete this category?`
        : `Delete category "${catToDelete}" from the storefront filter bar?`;

    if (!window.confirm(message)) return;
    const updated = storeCategories.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase());
    setStoreCategories(updated);
    useSettingsStore.getState().setSettings({ storeCategories: updated });

    try {
      const res = await fetch(`/api/admin/categories?name=${encodeURIComponent(catToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.storeCategories)) {
        setStoreCategories(data.storeCategories);
        useSettingsStore.getState().setSettings({ storeCategories: data.storeCategories });
      }
    } catch (err) {
      console.warn("Could not immediately delete category:", err);
    }
  };

  const handleResetCategories = async () => {
    if (window.confirm("Reset categories back to defaults (Makhana, Nuts, Pantry)?")) {
      const defaultCats = ["Makhana", "Nuts", "Pantry"];
      setStoreCategories(defaultCats);
      useSettingsStore.getState().setSettings({ storeCategories: defaultCats });

      try {
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset" }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.storeCategories)) {
          setStoreCategories(data.storeCategories);
          useSettingsStore.getState().setSettings({ storeCategories: data.storeCategories });
        }
      } catch (err) {
        console.warn("Could not immediately reset categories:", err);
      }
    }
  };

  const catalogProducts = products.length > 0 ? products : FALLBACK_PRODUCTS;

  // Active combo products logic
  const effectiveComboProductIds = useMemo(() => {
    if (comboProductIds.length > 0) return comboProductIds;
    return catalogProducts
      .filter((p) => !p.slug.toLowerCase().includes("raw") && !p.name.toLowerCase().includes("raw"))
      .map((p) => p.id);
  }, [comboProductIds, catalogProducts]);

  const isProductInCombo = (productId: string) => {
    return effectiveComboProductIds.includes(productId);
  };

  const handleToggleComboProduct = (productId: string) => {
    const baseList =
      comboProductIds.length === 0 ? [...effectiveComboProductIds] : [...comboProductIds];

    if (baseList.includes(productId)) {
      setComboProductIds(baseList.filter((id) => id !== productId));
    } else {
      setComboProductIds([...baseList, productId]);
    }
  };

  const handleSelectAllComboProducts = () => {
    setComboProductIds(catalogProducts.map((p) => p.id));
  };

  const handleSelectFlavouredComboProducts = () => {
    const flavouredIds = catalogProducts
      .filter((p) => !p.slug.toLowerCase().includes("raw") && !p.name.toLowerCase().includes("raw"))
      .map((p) => p.id);
    setComboProductIds(flavouredIds);
  };

  const handleClearAllComboProducts = () => {
    setComboProductIds([]);
  };

  const previewSelectedProducts = useMemo(() => {
    return catalogProducts.filter((p) => effectiveComboProductIds.includes(p.id));
  }, [catalogProducts, effectiveComboProductIds]);

  const handleResetComboDefaults = () => {
    setComboEnabled(DEFAULT_SETTINGS.comboEnabled);
    setComboEyebrow(DEFAULT_SETTINGS.comboEyebrow);
    setComboTitlePrefix(DEFAULT_SETTINGS.comboTitlePrefix);
    setComboTitleHighlight(DEFAULT_SETTINGS.comboTitleHighlight);
    setComboSubtitle(DEFAULT_SETTINGS.comboSubtitle);
    setComboTier1Count(String(DEFAULT_SETTINGS.comboTier1Count));
    setComboTier1Discount(String(DEFAULT_SETTINGS.comboTier1Discount));
    setComboTier1Label(DEFAULT_SETTINGS.comboTier1Label);
    setComboTier1Tagline(DEFAULT_SETTINGS.comboTier1Tagline);
    setComboTier1Badge(DEFAULT_SETTINGS.comboTier1Badge);
    setComboTier1Emoji(DEFAULT_SETTINGS.comboTier1Emoji);
    setComboTier2Count(String(DEFAULT_SETTINGS.comboTier2Count));
    setComboTier2Discount(String(DEFAULT_SETTINGS.comboTier2Discount));
    setComboTier2Label(DEFAULT_SETTINGS.comboTier2Label);
    setComboTier2Tagline(DEFAULT_SETTINGS.comboTier2Tagline);
    setComboTier2Badge(DEFAULT_SETTINGS.comboTier2Badge);
    setComboTier2Emoji(DEFAULT_SETTINGS.comboTier2Emoji);
    setComboButtonText(DEFAULT_SETTINGS.comboButtonText);
    setComboFooterNote(DEFAULT_SETTINGS.comboFooterNote);
    setComboProductIds(DEFAULT_SETTINGS.comboProductIds);
  };

  // Status & Save Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [heroImageError, setHeroImageError] = useState("");
  const [heroImageStatus, setHeroImageStatus] = useState("");
  const [heroVideoError, setHeroVideoError] = useState("");
  const [heroVideoStatus, setHeroVideoStatus] = useState("");
  const [heroVideoSaving, setHeroVideoSaving] = useState(false);
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const [heroVideoProgress, setHeroVideoProgress] = useState(0);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponDraft, setCouponDraft] = useState<CouponDraft>(emptyCoupon);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  // Hydrate editable controls from the persisted client store and settings API.
  /* eslint-disable react-hooks/set-state-in-effect */
  // Sync state on mount
  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    if (storeSettings.storeName) {
      setStoreName(storeSettings.storeName);
      setAnnouncementText(storeSettings.announcementText);
      if (typeof storeSettings.bottomAnnouncementText === "string") {
        setBottomAnnouncementText(storeSettings.bottomAnnouncementText);
      }
      if (typeof storeSettings.bottomAnnouncementEnabled === "boolean") {
        setBottomAnnouncementEnabled(storeSettings.bottomAnnouncementEnabled);
      }
      setHeroMainImage(storeSettings.heroMainImage);
      setHeroGheeImage(storeSettings.heroGheeImage);
      setHeroAlmondsImage(storeSettings.heroAlmondsImage);
      setHeroVideo(storeSettings.heroVideo);
      setHeroVideoOpacity(storeSettings.heroVideoOpacity);
      setHeartProductId(storeSettings.heartProductId);
      setHeartProductTitle(storeSettings.heartProductTitle);
      setHeartProductTagline(storeSettings.heartProductTagline);
      setHeartProductFeaturesText(storeSettings.heartProductFeatures.join("\n"));
      setHeartProductButtonText(storeSettings.heartProductButtonText);
      setHeartProductButtonUrl(storeSettings.heartProductButtonUrl);
      setHeartProductSubtitle(storeSettings.heartProductSubtitle);
      setHeartProductImage(storeSettings.heartProductImage);
      setFeaturedProductId(storeSettings.featuredProductId);
      setFeaturedProductHeading(storeSettings.featuredProductHeading);
      setFeaturedProductDescription(storeSettings.featuredProductDescription);
      setFeaturedProductImage(storeSettings.featuredProductImage);
      setFeaturedProductButtonText(storeSettings.featuredProductButtonText);
      setFounderName(storeSettings.founderName);
      setFounderImage(storeSettings.founderImage);
      setFounderRole(storeSettings.founderRole);
      setFounderStoryFirst(storeSettings.founderStoryFirst);
      setFounderStorySecond(storeSettings.founderStorySecond);
      setFounderQuote(storeSettings.founderQuote);
      setFounderTagsText(storeSettings.founderTags.join("\n"));
      setSupportPhone(storeSettings.supportPhone);
      setSupportEmail(storeSettings.supportEmail);
      setBusinessAddress(storeSettings.businessAddress);
      setFssaiNumber(storeSettings.fssaiNumber || "22126026000144");
      setDeliveryFeeRupees(String(Math.round((storeSettings.deliveryFee ?? 5000) / 100)));
      setFreeThresholdRupees(
        String(Math.round((storeSettings.freeDeliveryThreshold ?? 50000) / 100))
      );
      setIsAcceptingOrders(storeSettings.isAcceptingOrders);
      if (typeof storeSettings.comboEnabled === "boolean") setComboEnabled(storeSettings.comboEnabled);
      if (typeof storeSettings.comboEyebrow === "string") setComboEyebrow(storeSettings.comboEyebrow);
      if (typeof storeSettings.comboTitlePrefix === "string") setComboTitlePrefix(storeSettings.comboTitlePrefix);
      if (typeof storeSettings.comboTitleHighlight === "string") setComboTitleHighlight(storeSettings.comboTitleHighlight);
      if (typeof storeSettings.comboSubtitle === "string") setComboSubtitle(storeSettings.comboSubtitle);
      if (typeof storeSettings.comboTier1Count === "number") setComboTier1Count(String(storeSettings.comboTier1Count));
      if (typeof storeSettings.comboTier1Discount === "number") setComboTier1Discount(String(storeSettings.comboTier1Discount));
      if (typeof storeSettings.comboTier1Label === "string") setComboTier1Label(storeSettings.comboTier1Label);
      if (typeof storeSettings.comboTier1Tagline === "string") setComboTier1Tagline(storeSettings.comboTier1Tagline);
      if (typeof storeSettings.comboTier1Badge === "string") setComboTier1Badge(storeSettings.comboTier1Badge);
      if (typeof storeSettings.comboTier1Emoji === "string") setComboTier1Emoji(storeSettings.comboTier1Emoji);
      if (typeof storeSettings.comboTier2Count === "number") setComboTier2Count(String(storeSettings.comboTier2Count));
      if (typeof storeSettings.comboTier2Discount === "number") setComboTier2Discount(String(storeSettings.comboTier2Discount));
      if (typeof storeSettings.comboTier2Label === "string") setComboTier2Label(storeSettings.comboTier2Label);
      if (typeof storeSettings.comboTier2Tagline === "string") setComboTier2Tagline(storeSettings.comboTier2Tagline);
      if (typeof storeSettings.comboTier2Badge === "string") setComboTier2Badge(storeSettings.comboTier2Badge);
      if (typeof storeSettings.comboTier2Emoji === "string") setComboTier2Emoji(storeSettings.comboTier2Emoji);
      if (typeof storeSettings.comboButtonText === "string") setComboButtonText(storeSettings.comboButtonText);
      if (typeof storeSettings.comboFooterNote === "string") setComboFooterNote(storeSettings.comboFooterNote);
      if (Array.isArray(storeSettings.comboProductIds)) setComboProductIds(storeSettings.comboProductIds);
      if (Array.isArray(storeSettings.storeCategories) && storeSettings.storeCategories.length > 0) {
        setStoreCategories(storeSettings.storeCategories);
      }
    }

    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam === "categories") {
        setActiveTab("categories");
      }
    }

    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.storeName) {
          setStoreName(data.storeName);
          if (data.announcementText !== undefined) setAnnouncementText(data.announcementText);
          if (data.bottomAnnouncementText !== undefined) setBottomAnnouncementText(data.bottomAnnouncementText);
          if (typeof data.bottomAnnouncementEnabled === "boolean") {
            setBottomAnnouncementEnabled(data.bottomAnnouncementEnabled);
          }
          if (typeof data.heroMainImage === "string") setHeroMainImage(data.heroMainImage);
          if (typeof data.heroGheeImage === "string") setHeroGheeImage(data.heroGheeImage);
          if (typeof data.heroAlmondsImage === "string") setHeroAlmondsImage(data.heroAlmondsImage);
          if (typeof data.heroVideo === "string") setHeroVideo(data.heroVideo);
          if (typeof data.heroVideoOpacity === "number") setHeroVideoOpacity(data.heroVideoOpacity);
          if (typeof data.heartProductId === "string") setHeartProductId(data.heartProductId);
          if (typeof data.heartProductTitle === "string") setHeartProductTitle(data.heartProductTitle);
          if (typeof data.heartProductTagline === "string")
            setHeartProductTagline(data.heartProductTagline);
          if (Array.isArray(data.heartProductFeatures))
            setHeartProductFeaturesText(data.heartProductFeatures.join("\n"));
          if (typeof data.heartProductButtonText === "string")
            setHeartProductButtonText(data.heartProductButtonText);
          if (typeof data.heartProductButtonUrl === "string")
            setHeartProductButtonUrl(data.heartProductButtonUrl);
          if (typeof data.heartProductSubtitle === "string")
            setHeartProductSubtitle(data.heartProductSubtitle);
          if (typeof data.heartProductImage === "string")
            setHeartProductImage(data.heartProductImage);
          if (typeof data.featuredProductId === "string")
            setFeaturedProductId(data.featuredProductId);
          if (typeof data.featuredProductHeading === "string")
            setFeaturedProductHeading(data.featuredProductHeading);
          if (typeof data.featuredProductDescription === "string")
            setFeaturedProductDescription(data.featuredProductDescription);
          if (typeof data.featuredProductImage === "string")
            setFeaturedProductImage(data.featuredProductImage);
          if (typeof data.featuredProductButtonText === "string")
            setFeaturedProductButtonText(data.featuredProductButtonText);
          if (typeof data.founderName === "string") setFounderName(data.founderName);
          if (typeof data.founderImage === "string") setFounderImage(data.founderImage);
          if (typeof data.founderRole === "string") setFounderRole(data.founderRole);
          if (typeof data.founderStoryFirst === "string")
            setFounderStoryFirst(data.founderStoryFirst);
          if (typeof data.founderStorySecond === "string")
            setFounderStorySecond(data.founderStorySecond);
          if (typeof data.founderQuote === "string") setFounderQuote(data.founderQuote);
          if (Array.isArray(data.founderTags)) setFounderTagsText(data.founderTags.join("\n"));
          if (data.supportPhone !== undefined) setSupportPhone(data.supportPhone);
          if (data.supportEmail !== undefined) setSupportEmail(data.supportEmail);
          if (data.businessAddress !== undefined) setBusinessAddress(data.businessAddress);
          if (data.fssaiNumber !== undefined) setFssaiNumber(data.fssaiNumber);
          if (typeof data.deliveryFee === "number") {
            setDeliveryFeeRupees(String(Math.round(data.deliveryFee / 100)));
          }
          if (typeof data.freeDeliveryThreshold === "number") {
            setFreeThresholdRupees(String(Math.round(data.freeDeliveryThreshold / 100)));
          }
          if (typeof data.isAcceptingOrders === "boolean") {
            setIsAcceptingOrders(data.isAcceptingOrders);
          }
          if (typeof data.comboEnabled === "boolean") setComboEnabled(data.comboEnabled);
          if (typeof data.comboEyebrow === "string") setComboEyebrow(data.comboEyebrow);
          if (typeof data.comboTitlePrefix === "string") setComboTitlePrefix(data.comboTitlePrefix);
          if (typeof data.comboTitleHighlight === "string") setComboTitleHighlight(data.comboTitleHighlight);
          if (typeof data.comboSubtitle === "string") setComboSubtitle(data.comboSubtitle);
          if (typeof data.comboTier1Count === "number") setComboTier1Count(String(data.comboTier1Count));
          if (typeof data.comboTier1Discount === "number") setComboTier1Discount(String(data.comboTier1Discount));
          if (typeof data.comboTier1Label === "string") setComboTier1Label(data.comboTier1Label);
          if (typeof data.comboTier1Tagline === "string") setComboTier1Tagline(data.comboTier1Tagline);
          if (typeof data.comboTier1Badge === "string") setComboTier1Badge(data.comboTier1Badge);
          if (typeof data.comboTier1Emoji === "string") setComboTier1Emoji(data.comboTier1Emoji);
          if (typeof data.comboTier2Count === "number") setComboTier2Count(String(data.comboTier2Count));
          if (typeof data.comboTier2Discount === "number") setComboTier2Discount(String(data.comboTier2Discount));
          if (typeof data.comboTier2Label === "string") setComboTier2Label(data.comboTier2Label);
          if (typeof data.comboTier2Tagline === "string") setComboTier2Tagline(data.comboTier2Tagline);
          if (typeof data.comboTier2Badge === "string") setComboTier2Badge(data.comboTier2Badge);
          if (typeof data.comboTier2Emoji === "string") setComboTier2Emoji(data.comboTier2Emoji);
          if (typeof data.comboButtonText === "string") setComboButtonText(data.comboButtonText);
          if (typeof data.comboFooterNote === "string") setComboFooterNote(data.comboFooterNote);
          if (Array.isArray(data.comboProductIds)) setComboProductIds(data.comboProductIds);
          if (Array.isArray(data.storeCategories) && data.storeCategories.length > 0) {
            setStoreCategories(data.storeCategories);
          }
        }
      })
      .catch(() => {
        console.warn("Could not fetch remote settings.");
      });
  // Intentionally run once: the API fetch below is the source for later server changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.coupons)) setCoupons(data.coupons);
      })
      .catch(() => setCouponMessage("Could not load coupons."));
  }, []);

  const saveCoupon = async () => {
    setCouponBusy(true);
    setCouponMessage("");
    try {
      const payload = {
        ...couponDraft,
        startsAt: couponDraft.startsAt
          ? new Date(couponDraft.startsAt).toISOString()
          : new Date().toISOString(),
        expiresAt: couponDraft.expiresAt ? new Date(couponDraft.expiresAt).toISOString() : "",
      };
      const response = await fetch(
        editingCouponId ? `/api/admin/coupons/${editingCouponId}` : "/api/admin/coupons",
        {
          method: editingCouponId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save coupon.");
      const list = await fetch("/api/admin/coupons").then((res) => res.json());
      setCoupons(list.coupons || []);
      setCouponDraft(emptyCoupon);
      setEditingCouponId(null);
      setCouponMessage("Coupon saved successfully.");
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : "Could not save coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setActiveTab("coupons");
    setCouponDraft({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(
        coupon.discountType === "FIXED" ? coupon.discountValue / 100 : coupon.discountValue
      ),
      minimumSubtotal: String(coupon.minimumSubtotal / 100),
      maximumDiscount: coupon.maximumDiscount == null ? "" : String(coupon.maximumDiscount / 100),
      startsAt: toLocalDateTimeInput(new Date(coupon.startsAt)),
      expiresAt: coupon.expiresAt ? toLocalDateTimeInput(new Date(coupon.expiresAt)) : "",
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      perCustomerLimit: coupon.perCustomerLimit == null ? "" : String(coupon.perCustomerLimit),
      firstOrderOnly: coupon.firstOrderOnly,
      isActive: coupon.isActive,
    });
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm("Delete this coupon? It will no longer be accepted at checkout.")) return;
    const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setCouponMessage(result.error || "Could not delete coupon.");
      return;
    }
    setCoupons((current) => current.filter((coupon) => coupon.id !== id));
  };

  const handleHeroImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (image: string) => void
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setHeroImageError("");
    try {
      setImage(await compressHeroImage(file));
    } catch (error) {
      setHeroImageError(error instanceof Error ? error.message : "Could not process this image.");
    }
  };

  const saveHeroBubbleImage = async (position: "center" | "topRight" | "bottomLeft", image: string) => {
    setHeroImageError("");
    setHeroImageStatus("Saving bubble image to the database…");
    try {
      const response = await fetch("/api/admin/settings/hero-bubbles", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, image }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save this bubble image.");
      const field = position === "center" ? "heroMainImage" : position === "topRight" ? "heroGheeImage" : "heroAlmondsImage";
      useSettingsStore.getState().setSettings({ [field]: image });
      setSaveError("");
      setHeroImageStatus("Bubble image saved to the database.");
      return true;
    } catch (error) {
      setHeroImageStatus("");
      setHeroImageError(error instanceof Error ? error.message : "Could not save this bubble image.");
      return false;
    }
  };

  const handleBubbleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    position: "center" | "topRight" | "bottomLeft",
    setImage: (image: string) => void,
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const image = await compressHeroImage(file);
      if (await saveHeroBubbleImage(position, image)) setImage(image);
    } catch (error) {
      setHeroImageError(error instanceof Error ? error.message : "Could not process this image.");
    }
  };

  const handleHeroVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setHeroVideoError("");
    setHeroVideoStatus("");

    if (!/^video\/(mp4|webm)$/i.test(file.type)) {
      setHeroVideoError("Choose an MP4 or WebM video.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setHeroVideoError("This video is over the 50 MB upload limit.");
      return;
    }

    setHeroVideoUploading(true);
    setHeroVideoProgress(0);
    setHeroVideoStatus("Starting secure upload…");
    try {
      const extension = file.type === "video/webm" ? "webm" : "mp4";
      const blob = await upload(`hero-background.${extension}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/settings/hero-video/upload",
        multipart: true,
        onUploadProgress: ({ percentage }) => {
          const progress = Math.round(percentage);
          setHeroVideoProgress(progress);
          setHeroVideoStatus(`Uploading video… ${progress}%`);
        },
      });
      setHeroVideo(blob.url);
      setHeroVideoStatus("Upload complete. Publishing video…");
      await saveHeroVideoSettings(blob.url, heroVideoOpacity);
    } catch (error) {
      setHeroVideoError(error instanceof Error ? error.message : "Video upload failed. Please try again.");
      setHeroVideoStatus("");
    } finally {
      setHeroVideoUploading(false);
    }
  };

  const saveHeroVideoSettings = async (video = heroVideo, opacity = heroVideoOpacity): Promise<boolean> => {
    setHeroVideoSaving(true);
    setHeroVideoError("");
    setHeroVideoStatus("");
    try {
      const response = await fetch("/api/admin/settings/hero-video", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video, opacity }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save hero video settings.");
      setHeroVideo(video);
      setHeroVideoOpacity(opacity);
      useSettingsStore.getState().setSettings({ heroVideo: video, heroVideoOpacity: opacity });
      setHeroVideoStatus(video ? "Hero video saved and live on the homepage." : "Hero video removed from the homepage.");
      return true;
    } catch (error) {
      setHeroVideoError(error instanceof Error ? error.message : "Could not save hero video settings.");
      return false;
    } finally {
      setHeroVideoSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    setStatusMessage("");

    const deliveryFeePaise = Math.round((parseFloat(deliveryFeeRupees) || 0) * 100);
    const freeThresholdPaise = Math.round((parseFloat(freeThresholdRupees) || 0) * 100);

    const payload = {
      storeName: storeName.trim() || DEFAULT_SETTINGS.storeName,
      announcementText: announcementText.trim(),
      bottomAnnouncementText: bottomAnnouncementText.trim(),
      bottomAnnouncementEnabled,
      heroMainImage,
      heroGheeImage,
      heroAlmondsImage,
      heartProductId,
      heartProductTitle: heartProductTitle.trim() || DEFAULT_SETTINGS.heartProductTitle,
      heartProductTagline: heartProductTagline.trim() || DEFAULT_SETTINGS.heartProductTagline,
      heartProductFeatures: heartProductFeaturesText
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean)
        .slice(0, 12),
      heartProductButtonText:
        heartProductButtonText.trim() || DEFAULT_SETTINGS.heartProductButtonText,
      heartProductButtonUrl: heartProductButtonUrl.trim(),
      heartProductSubtitle: heartProductSubtitle.trim() || DEFAULT_SETTINGS.heartProductSubtitle,
      heartProductImage,
      featuredProductId,
      featuredProductHeading:
        featuredProductHeading.trim() || DEFAULT_SETTINGS.featuredProductHeading,
      featuredProductDescription:
        featuredProductDescription.trim() || DEFAULT_SETTINGS.featuredProductDescription,
      featuredProductImage,
      featuredProductButtonText:
        featuredProductButtonText.trim() || DEFAULT_SETTINGS.featuredProductButtonText,
      founderName: founderName.trim() || DEFAULT_SETTINGS.founderName,
      founderImage,
      founderRole: founderRole.trim() || DEFAULT_SETTINGS.founderRole,
      founderStoryFirst: founderStoryFirst.trim() || DEFAULT_SETTINGS.founderStoryFirst,
      founderStorySecond: founderStorySecond.trim() || DEFAULT_SETTINGS.founderStorySecond,
      founderQuote: founderQuote.trim() || DEFAULT_SETTINGS.founderQuote,
      founderTags: founderTagsText
        .split("\n")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
      supportPhone: supportPhone.trim() || DEFAULT_SETTINGS.supportPhone,
      supportEmail: supportEmail.trim() || DEFAULT_SETTINGS.supportEmail,
      businessAddress: businessAddress.trim() || DEFAULT_SETTINGS.businessAddress,
      fssaiNumber: fssaiNumber.trim() || DEFAULT_SETTINGS.fssaiNumber || "22126026000144",
      deliveryFee: deliveryFeePaise,
      freeDeliveryThreshold: freeThresholdPaise,
      isAcceptingOrders,
      comboEnabled,
      comboEyebrow: comboEyebrow.trim() || DEFAULT_SETTINGS.comboEyebrow,
      comboTitlePrefix: comboTitlePrefix.trim() || DEFAULT_SETTINGS.comboTitlePrefix,
      comboTitleHighlight: comboTitleHighlight.trim() || DEFAULT_SETTINGS.comboTitleHighlight,
      comboSubtitle: comboSubtitle.trim() || DEFAULT_SETTINGS.comboSubtitle,
      comboTier1Count: Number(comboTier1Count) || DEFAULT_SETTINGS.comboTier1Count,
      comboTier1Discount: Number(comboTier1Discount) || DEFAULT_SETTINGS.comboTier1Discount,
      comboTier1Label: comboTier1Label.trim() || DEFAULT_SETTINGS.comboTier1Label,
      comboTier1Tagline: comboTier1Tagline.trim() || DEFAULT_SETTINGS.comboTier1Tagline,
      comboTier1Badge: comboTier1Badge.trim() || DEFAULT_SETTINGS.comboTier1Badge,
      comboTier1Emoji: comboTier1Emoji.trim() || DEFAULT_SETTINGS.comboTier1Emoji,
      comboTier2Count: Number(comboTier2Count) || DEFAULT_SETTINGS.comboTier2Count,
      comboTier2Discount: Number(comboTier2Discount) || DEFAULT_SETTINGS.comboTier2Discount,
      comboTier2Label: comboTier2Label.trim() || DEFAULT_SETTINGS.comboTier2Label,
      comboTier2Tagline: comboTier2Tagline.trim() || DEFAULT_SETTINGS.comboTier2Tagline,
      comboTier2Badge: comboTier2Badge.trim() || DEFAULT_SETTINGS.comboTier2Badge,
      comboTier2Emoji: comboTier2Emoji.trim() || DEFAULT_SETTINGS.comboTier2Emoji,
      comboButtonText: comboButtonText.trim() || DEFAULT_SETTINGS.comboButtonText,
      comboFooterNote: comboFooterNote.trim() || DEFAULT_SETTINGS.comboFooterNote,
      comboProductIds,
      storeCategories,
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const diagnostic = [result.code, result.reason, result.databaseCode ? `MongoDB ${result.databaseCode}` : ""]
          .filter(Boolean)
          .join(" · ");
        throw new Error(`${result.error || "Could not save settings."}${diagnostic ? ` (${diagnostic})` : ""}`);
      }
      useSettingsStore.getState().setSettings(result.settings || payload);
      setSaveSuccess(true);
      setStatusMessage("Store settings saved live across your website!");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const selectedFeaturedProduct =
    products.find((p) => p.id === featuredProductId || p.slug === featuredProductId) ||
    products.find((p) => p.category?.toLowerCase() === "makhana") ||
    products[0] ||
    null;

  const selectedHeartProduct =
    products.find((p) => p.id === heartProductId || p.slug === heartProductId) || null;

  const handleAutoFillFeaturedProduct = (product: StoreProduct) => {
    setFeaturedProductId(product.id);
    setFeaturedProductHeading(product.name);
    setFeaturedProductDescription(product.shortDescription || product.description);
    setFeaturedProductImage("");
    setFeaturedProductButtonText("View Details & Add to Cart");
  };

  const handleAutoFillHeartProduct = (product: StoreProduct) => {
    setHeartProductId(product.id);
    setHeartProductTitle(product.name);
    setHeartProductTagline(product.shortDescription || "Why not? You deserve the best.");
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(product.tags || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) tags = parsed;
    } catch {
      tags = [];
    }
    if (tags.length > 0) {
      setHeartProductFeaturesText(tags.join("\n"));
    }
    setHeartProductButtonUrl(`/products/${product.slug}`);
    setHeartProductButtonText("Shop Now");
  };

  const heroImageFields = [
    {
      key: "main",
      position: "center" as const,
      label: "Center",
      image: heroMainImage,
      setImage: setHeroMainImage,
      defaultImage: DEFAULT_SETTINGS.heroMainImage,
    },
    {
      key: "ghee",
      position: "topRight" as const,
      label: "Top right",
      image: heroGheeImage,
      setImage: setHeroGheeImage,
      defaultImage: DEFAULT_SETTINGS.heroGheeImage,
    },
    {
      key: "almonds",
      position: "bottomLeft" as const,
      label: "Bottom left",
      image: heroAlmondsImage,
      setImage: setHeroAlmondsImage,
      defaultImage: DEFAULT_SETTINGS.heroAlmondsImage,
    },
  ];

  const TAB_ITEMS: { id: SettingsTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "products", label: "Featured & Spotlights", icon: Sparkles, badge: "3 items" },
    { id: "combo", label: "Combo Builder", icon: Sliders, badge: comboEnabled ? "Active" : "Paused" },
    { id: "categories", label: "Categories Bar", icon: LayoutGrid, badge: `${storeCategories.length} tabs` },
    { id: "store", label: "Store & Brand", icon: Store, badge: isAcceptingOrders ? "Online" : "Paused" },
    { id: "operations", label: "Delivery & Support", icon: Truck, badge: `₹${deliveryFeeRupees} fee` },
    { id: "founder", label: "Founder Story", icon: HeartHandshake },
    { id: "coupons", label: "Coupons & Discounts", icon: TicketPercent, badge: `${coupons.filter(c => c.isActive).length} active` },
    { id: "all", label: "All Settings", icon: LayoutGrid },
  ];

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-6 pb-20"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
    >
      {/* ============================================================== */}
      {/* EYE-SOOTHING HEADER                                            */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 sm:p-7 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1A4031] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Store size={22} className="text-[#E8F3EE]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                  Store Settings
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    isAcceptingOrders
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAcceptingOrders ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  {isAcceptingOrders ? "Store online" : "Orders paused"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
                Organize your homepage products, spotlight features, delivery charges, and store preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-xs sm:text-sm font-semibold transition-all"
            >
              <ExternalLink size={14} className="text-stone-500" />
              <span>Preview Store</span>
            </Link>
            <motion.button
              onClick={() => handleSave()}
              disabled={isSaving}
              whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw size={15} className="animate-spin text-white" />
              ) : saveSuccess ? (
                <CheckCircle2 size={15} className="text-emerald-300" />
              ) : (
                <Save size={15} />
              )}
              <span>{isSaving ? "Saving…" : saveSuccess ? "Saved!" : "Save Changes"}</span>
            </motion.button>
          </div>
        </div>

        {/* Status Alerts */}
        <AnimatePresence initial={false}>
          {saveSuccess && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="mt-4 p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  {statusMessage || "Settings applied live across your store!"}
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Live &amp; Synced
              </span>
            </motion.div>
          )}
          {saveError && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs sm:text-sm font-medium text-rose-700 flex items-center gap-2"
            >
              <span className="font-bold">Error:</span> {saveError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================== */}
      {/* ORGANIZED SEGMENTED NAVIGATION TABS (Sticky & Eye-Soothing)    */}
      {/* ============================================================== */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/80 shadow-xs">
        <nav className="flex flex-wrap items-center gap-1.5 py-0.5">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#1A4031] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#D8EADB]" : "text-stone-400"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ============================================================== */}
      {/* MAIN SETTINGS FORM                                             */}
      {/* ============================================================== */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: Featured & Spotlights (Homepage & About Us)          */}
        {/* ------------------------------------------------------------ */}
        {(activeTab === "products" || activeTab === "all") && (
          <div className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 pt-2 border-b border-stone-200 pb-2">
                <Sparkles size={18} className="text-brand-green" />
                <h2 className="text-base font-bold text-stone-900">Featured &amp; Spotlights</h2>
              </div>
            )}

            {/* Card 1A: Homepage Featured Product (Pic 2) */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 transition-all hover:border-stone-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Homepage Featured Product
                    </h3>
                    <p className="text-xs text-stone-500">
                      Showcase your signature snack on the homepage hero/featured banner.
                    </p>
                  </div>
                </div>

                {selectedFeaturedProduct && (
                  <button
                    type="button"
                    onClick={() => handleAutoFillFeaturedProduct(selectedFeaturedProduct)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green/10 text-brand-green font-semibold text-xs hover:bg-brand-green/20 transition-colors self-start sm:self-auto cursor-pointer"
                    title="Fill heading, description and reset image to product defaults"
                  >
                    <Wand2 size={13} />
                    <span>Auto-fill from product</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Select Product to Feature</label>
                  <select
                    value={featuredProductId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFeaturedProductId(val);
                      const prod = products.find((p) => p.id === val);
                      if (prod) {
                        if (!featuredProductHeading || products.some((p) => p.name === featuredProductHeading)) {
                          setFeaturedProductHeading(prod.name);
                        }
                        if (
                          !featuredProductDescription ||
                          products.some((p) => (p.shortDescription || p.description) === featuredProductDescription)
                        ) {
                          setFeaturedProductDescription(prod.shortDescription || prod.description);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  >
                    <option value="">-- Default (Phool Makhana) --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{(p.basePrice / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Section Heading</label>
                  <input
                    type="text"
                    value={featuredProductHeading}
                    onChange={(e) => setFeaturedProductHeading(e.target.value)}
                    placeholder="e.g. Meet Your New Favourite Snack."
                    maxLength={120}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Button Text</label>
                  <input
                    type="text"
                    value={featuredProductButtonText}
                    onChange={(e) => setFeaturedProductButtonText(e.target.value)}
                    placeholder="View Details & Add to Cart"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Description</label>
                  <textarea
                    value={featuredProductDescription}
                    onChange={(e) => setFeaturedProductDescription(e.target.value)}
                    placeholder="Short description highlighting crunch, roasting, or natural flavors"
                    maxLength={300}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm resize-y transition-all"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Custom Image (Optional Override)</label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-green/10 px-3.5 py-2 text-xs font-semibold text-brand-green hover:bg-brand-green/20 transition-colors">
                      <ImagePlus size={14} /> Upload Custom Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => void handleHeroImageUpload(event, setFeaturedProductImage)}
                      />
                    </label>
                    {featuredProductImage && (
                      <button
                        type="button"
                        onClick={() => setFeaturedProductImage("")}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        <RotateCcw size={13} /> Revert to Product Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview (Pic 2 Match) */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Live Homepage Preview
                </p>
                <div className="rounded-2xl bg-brand-pink/50 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 border border-brand-pink-accent/40 shadow-xs">
                  <div className="h-32 w-32 sm:h-36 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-white border border-brand-pink-accent/40 shadow-sm relative">
                    <Image
                      src={featuredProductImage || selectedFeaturedProduct?.imageUrl || "/images/makhana_sig.jpg"}
                      alt="Featured product preview"
                      width={144}
                      height={144}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-brand-green leading-snug">
                      {featuredProductHeading || selectedFeaturedProduct?.name || DEFAULT_SETTINGS.featuredProductHeading}
                    </h4>
                    <p className="text-xs text-brand-charcoal/80 line-clamp-2 leading-relaxed">
                      {featuredProductDescription || selectedFeaturedProduct?.shortDescription || DEFAULT_SETTINGS.featuredProductDescription}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <span className="text-base font-bold text-brand-green">
                        ₹{(((selectedFeaturedProduct?.basePrice ?? 37425)) / 100).toFixed(2)}
                      </span>
                      {selectedFeaturedProduct?.originalPrice && selectedFeaturedProduct.originalPrice > selectedFeaturedProduct.basePrice && (
                        <span className="text-xs text-brand-charcoal/40 line-through">
                          ₹{(selectedFeaturedProduct.originalPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="inline-block rounded-lg bg-brand-green text-brand-ivory text-xs font-semibold px-4 py-2 shadow-xs text-center">
                        {featuredProductButtonText || "View Details & Add to Cart"}
                      </span>
                      <span className="text-[11px] text-stone-500 truncate">
                        Destination: /products/{selectedFeaturedProduct?.slug || "makhana"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 1B: Heart Product Spotlight (Pic 3) */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 transition-all hover:border-stone-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-pink/60 text-brand-green flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Heart Product Spotlight (About Us Page)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Configure the centerpiece card and benefits banner on your About Us page.
                    </p>
                  </div>
                </div>

                {selectedHeartProduct && (
                  <button
                    type="button"
                    onClick={() => handleAutoFillHeartProduct(selectedHeartProduct)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green/10 text-brand-green font-semibold text-xs hover:bg-brand-green/20 transition-colors self-start sm:self-auto cursor-pointer"
                    title="Fill heading, tagline, benefits and link from selected product"
                  >
                    <Wand2 size={13} />
                    <span>Auto-fill from product</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Link Store Product</label>
                  <select
                    value={heartProductId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeartProductId(val);
                      const prod = products.find((p) => p.id === val);
                      if (prod) {
                        setHeartProductButtonUrl(`/products/${prod.slug}`);
                        if (!heartProductTitle || products.some((p) => p.name === heartProductTitle)) {
                          setHeartProductTitle(prod.name);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  >
                    <option value="">-- Custom Product / Standalone --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{(p.basePrice / 100).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Product Heading</label>
                  <input
                    type="text"
                    value={heartProductTitle}
                    onChange={(e) => setHeartProductTitle(e.target.value)}
                    placeholder="e.g. Premium Phool Makhana"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Section Label / Subtitle</label>
                  <input
                    type="text"
                    value={heartProductSubtitle}
                    onChange={(e) => setHeartProductSubtitle(e.target.value)}
                    placeholder="e.g. Our Heart Product"
                    maxLength={80}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Tagline / Motto</label>
                  <input
                    type="text"
                    value={heartProductTagline}
                    onChange={(e) => setHeartProductTagline(e.target.value)}
                    placeholder="e.g. Why not? You deserve the best."
                    maxLength={160}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">
                    Product Benefits (one per line, up to 12)
                  </label>
                  <textarea
                    value={heartProductFeaturesText}
                    onChange={(e) => setHeartProductFeaturesText(e.target.value)}
                    rows={3}
                    placeholder="Plant-Based&#10;Gluten-Free&#10;Low Calorie"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm resize-y transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Button Text</label>
                  <input
                    type="text"
                    value={heartProductButtonText}
                    onChange={(e) => setHeartProductButtonText(e.target.value)}
                    placeholder="Shop Now"
                    maxLength={40}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Button URL / Destination</label>
                  <input
                    type="text"
                    value={heartProductButtonUrl}
                    onChange={(e) => setHeartProductButtonUrl(e.target.value)}
                    placeholder={selectedHeartProduct ? `/products/${selectedHeartProduct.slug}` : "/products"}
                    maxLength={120}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Live Preview (Pic 3 Match) */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Live Spotlight Preview (About Us Page)
                </p>
                <div className="rounded-2xl bg-brand-green text-brand-ivory p-6 sm:p-8 text-center space-y-4 shadow-md">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-champagne">
                    {heartProductSubtitle || "Our Heart Product"}
                  </p>
                  <h4 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                    {heartProductTitle || selectedHeartProduct?.name || DEFAULT_SETTINGS.heartProductTitle}
                  </h4>
                  <p className="italic text-brand-pink text-sm sm:text-base font-light">
                    {heartProductTagline || selectedHeartProduct?.shortDescription || DEFAULT_SETTINGS.heartProductTagline}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-1">
                    {heartProductFeaturesText
                      .split("\n")
                      .map((feature) => feature.trim())
                      .filter(Boolean)
                      .slice(0, 12)
                      .map((feature, index) => (
                        <span
                          key={`${feature}-${index}`}
                          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                  </div>
                  <div className="pt-3 flex flex-col items-center gap-1.5">
                    <span className="inline-block rounded-full bg-brand-pink text-brand-green font-bold px-7 py-2.5 text-xs sm:text-sm shadow-sm">
                      {heartProductButtonText || "Shop Now"}
                    </span>
                    <span className="text-[10px] text-brand-ivory/60 truncate max-w-xs">
                      Destination: {heartProductButtonUrl || (selectedHeartProduct ? `/products/${selectedHeartProduct.slug}` : "/products")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 1C: Homepage Hero Bubble Images */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 transition-all hover:border-stone-300">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                  <ImagePlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Homepage Floating Bubble Images
                  </h3>
                    <p className="text-xs text-stone-500">
                    Bubble uploads and resets are saved to the database immediately.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {heroImageFields.map((field) => (
                  <div
                    key={field.key}
                    className="flex flex-col items-center text-center gap-3 rounded-2xl border border-stone-200/80 p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-brand-pink-accent/40 bg-white shadow-sm">
                      <Image key={`${field.key}-${field.image.slice(0, 80)}`} src={field.image} alt={`${field.label} hero bubble preview`} width={80} height={80} unoptimized className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-1 w-full">
                      <p className="text-xs font-bold text-stone-800 truncate">{field.label}</p>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-semibold text-brand-green hover:bg-brand-green/20 transition-colors">
                          <ImagePlus size={13} /> Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => void handleBubbleImageUpload(event, field.position, field.setImage)}
                          />
                        </label>
                        {field.image !== field.defaultImage && (
                          <button
                            type="button"
                            onClick={() => void saveHeroBubbleImage(field.position, field.defaultImage).then((saved) => {
                              if (saved) field.setImage(field.defaultImage);
                            })}
                            className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-stone-500 hover:bg-stone-200/60 transition-colors cursor-pointer"
                          >
                            <RotateCcw size={11} /> Reset to Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {heroImageStatus && <p role="status" className="text-xs font-medium text-emerald-700">{heroImageStatus}</p>}
              {heroImageError && <p role="alert" className="text-xs font-medium text-rose-700">{heroImageError}</p>}
            </div>

            <div id="settings-hero-video" className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                    <Video size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">Homepage Hero Background Video</h3>
                    <p className="mt-1 text-xs text-stone-500">Add a subtle looping video behind the hero content. The text and product images stay above it.</p>
                  </div>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${heroVideo ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>
                  {heroVideo ? "Video enabled" : "Using current background"}
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-green/30 bg-brand-green/[0.04] px-4 py-4 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-green/10">
                    {heroVideoUploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    {heroVideoUploading ? `Uploading… ${heroVideoProgress}%` : "Upload MP4 or WebM (up to 50 MB)"}
                    <input type="file" accept="video/mp4,video/webm,.mp4,.webm" className="sr-only" disabled={heroVideoUploading || heroVideoSaving} onChange={(event) => void handleHeroVideoUpload(event)} />
                  </label>
                  <p className="text-[11px] leading-relaxed text-stone-500">Videos upload directly to secure object storage with progress and retry support. A public Vercel Blob store must be connected to this project. You can also paste a direct HTTPS MP4/WebM URL.</p>

                  <div className="space-y-1.5">
                    <label htmlFor="hero-video-url" className="block text-xs font-bold text-stone-700">Or use a hosted video URL</label>
                    <input
                      id="hero-video-url"
                      type="url"
                      value={heroVideo.startsWith("data:") ? "" : heroVideo}
                      onChange={(event) => {
                        setHeroVideo(event.target.value.trim());
                        setHeroVideoError("");
                        setHeroVideoStatus("");
                      }}
                      placeholder="https://cdn.example.com/hero-video.mp4"
                      maxLength={2048}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm transition-all focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/15"
                    />
                    <p className="text-[10px] text-stone-400">Use a direct .mp4 or .webm file URL. YouTube watch links are not supported as background video sources.</p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="hero-video-opacity" className="text-xs font-bold text-stone-700">Video opacity</label>
                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-brand-green shadow-sm">{heroVideoOpacity}%</span>
                    </div>
                    <input
                      id="hero-video-opacity"
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={heroVideoOpacity}
                      onChange={(event) => setHeroVideoOpacity(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-brand-green"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400"><span>Subtle</span><span>Full strength</span></div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={heroVideoSaving || heroVideoUploading} onClick={() => void saveHeroVideoSettings()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-60">
                      {heroVideoSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      {heroVideoSaving ? "Saving…" : "Save video settings"}
                    </button>
                    {heroVideo && (
                      <button type="button" disabled={heroVideoSaving || heroVideoUploading} onClick={() => void saveHeroVideoSettings("", heroVideoOpacity)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <Trash2 size={14} /> Remove video
                      </button>
                    )}
                  </div>
                  {heroVideoStatus && <p role="status" className="text-xs font-medium text-emerald-700">{heroVideoStatus}</p>}
                  {heroVideoError && <p role="alert" className="text-xs font-medium text-rose-700">{heroVideoError}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <span>Background preview</span><span>Text contrast overlay included</span>
                  </div>
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-stone-200 bg-[radial-gradient(at_0%_0%,#f7e1d7,transparent_65%),radial-gradient(at_100%_100%,#9db4a0,transparent_65%),#fff5e6] shadow-inner">
                    {heroVideo ? (
                      <video key={heroVideo} src={heroVideo} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: heroVideoOpacity / 100 }} />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-500">
                        <Video size={25} className="opacity-50" />
                        <span className="text-xs font-medium">No background video selected</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-white/35" />
                    <div className="absolute inset-0 flex flex-col justify-center p-5 sm:p-7">
                      <p className="max-w-[75%] font-serif text-xl font-semibold leading-tight text-brand-green drop-shadow-sm sm:text-3xl">Goodness That<br /><span className="italic font-light">Feels Like Home.</span></p>
                      <span className="mt-3 w-fit rounded-full bg-brand-green px-3 py-1 text-[10px] font-semibold text-white">Shop Now</span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-stone-400">Muted, looping, and inline playback are enabled for a calm, autoplay-friendly experience.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB: Make Your Own Combo / Bundle Builder                   */}
        {/* ------------------------------------------------------------ */}
        {(activeTab === "combo" || activeTab === "all") && (
          <div className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 pt-4 border-b border-stone-200 pb-2">
                <Sliders size={18} className="text-brand-green" />
                <h2 className="text-base font-bold text-stone-900">Make Your Own Combo Builder</h2>
              </div>
            )}

            {/* Main Configuration Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 transition-all hover:border-stone-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink/60 to-brand-pink text-brand-green flex items-center justify-center shrink-0 border border-brand-pink-accent/40 shadow-xs">
                    <Sliders size={20} className="text-brand-green" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                        Curate Your Combo Builder
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          comboEnabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-stone-100 text-stone-500 border-stone-200"
                        }`}
                      >
                        {comboEnabled ? "● Live on Website" : "○ Hidden"}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Customize titles, bundle quantities, discount percentages, and tags for your mix &amp; match Makhana combo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <Link
                    href="/combo"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>View /combo</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleResetComboDefaults}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs font-medium transition-colors cursor-pointer"
                    title="Reset all combo settings back to default"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Master Enabled / Disabled Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <span>Show Combo Builder Section</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      (Homepage, Products page &amp; /combo page)
                    </span>
                  </label>
                  <p className="text-xs text-stone-500">
                    When active, customers can choose flavours and add bundle discounts straight to cart.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setComboEnabled(!comboEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    comboEnabled ? "bg-emerald-600" : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={comboEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      comboEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Section Header Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Eyebrow Badge Text</label>
                  <input
                    type="text"
                    value={comboEyebrow}
                    onChange={(e) => setComboEyebrow(e.target.value)}
                    placeholder="Make Your Own Combo"
                    maxLength={80}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                  <p className="text-[11px] text-stone-400">
                    The small uppercase badge text with sparkles displayed above the title.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Title Prefix</label>
                  <input
                    type="text"
                    value={comboTitlePrefix}
                    onChange={(e) => setComboTitlePrefix(e.target.value)}
                    placeholder="Curate Your"
                    maxLength={80}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Title Highlighted Words (Gradient Italic Text)
                  </label>
                  <input
                    type="text"
                    value={comboTitleHighlight}
                    onChange={(e) => setComboTitleHighlight(e.target.value)}
                    placeholder="Pink Farm Combo"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700">Section Subtitle / Explanatory Description</label>
                  <textarea
                    value={comboSubtitle}
                    onChange={(e) => setComboSubtitle(e.target.value)}
                    rows={2}
                    placeholder="Mix & match your favourite flavoured makhanas. Add multiple packs of any flavour — combo discounts apply directly on the original MRP!"
                    maxLength={300}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm resize-y transition-all"
                  />
                </div>
              </div>

              {/* Tier Cards: Tier 1 and Tier 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* TIER 1 CARD */}
                <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-100/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{comboTier1Emoji || "🌿"}</span>
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                          Tier 1 Configuration
                        </h4>
                        <p className="text-[11px] text-stone-500">Smaller bundle option</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      {comboTier1Count || 3} Packs · {comboTier1Discount || 11}% OFF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Tier Name</label>
                      <input
                        type="text"
                        value={comboTier1Label}
                        onChange={(e) => setComboTier1Label(e.target.value)}
                        placeholder="Trio Combo"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Emoji Icon</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={comboTier1Emoji}
                          onChange={(e) => setComboTier1Emoji(e.target.value)}
                          placeholder="🌿"
                          maxLength={6}
                          className="w-16 px-2.5 py-2 text-center rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                        />
                        <div className="flex items-center gap-1">
                          {["🌿", "🌱", "✨", "🌸", "🥜"].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setComboTier1Emoji(em)}
                              className="text-sm p-1 rounded-md hover:bg-stone-200/60 cursor-pointer"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Required Items Count</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={comboTier1Count}
                        onChange={(e) => setComboTier1Count(e.target.value)}
                        placeholder="3"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Discount Percentage (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={comboTier1Discount}
                          onChange={(e) => setComboTier1Discount(e.target.value)}
                          placeholder="11"
                          className="w-full px-3 py-2 pr-7 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                        />
                        <span className="absolute right-3 top-2 text-stone-400 text-xs font-bold">%</span>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="block text-xs font-bold text-stone-700">Badge Text</label>
                      <input
                        type="text"
                        value={comboTier1Badge}
                        onChange={(e) => setComboTier1Badge(e.target.value)}
                        placeholder="✦ 11% OFF"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="block text-xs font-bold text-stone-700">Tagline / Instruction</label>
                      <input
                        type="text"
                        value={comboTier1Tagline}
                        onChange={(e) => setComboTier1Tagline(e.target.value)}
                        placeholder="Pick any 3 — save 11% on MRP"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* TIER 2 CARD */}
                <div className="rounded-2xl border-2 border-pink-100 bg-gradient-to-b from-pink-50/40 to-white p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-pink-100/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{comboTier2Emoji || "🌸"}</span>
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
                          Tier 2 Configuration
                        </h4>
                        <p className="text-[11px] text-stone-500">Bigger bundle option</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-pink-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                      {comboTier2Count || 5} Packs · {comboTier2Discount || 15}% OFF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Tier Name</label>
                      <input
                        type="text"
                        value={comboTier2Label}
                        onChange={(e) => setComboTier2Label(e.target.value)}
                        placeholder="Penta Combo"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Emoji Icon</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={comboTier2Emoji}
                          onChange={(e) => setComboTier2Emoji(e.target.value)}
                          placeholder="🌸"
                          maxLength={6}
                          className="w-16 px-2.5 py-2 text-center rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                        />
                        <div className="flex items-center gap-1">
                          {["🌸", "🌿", "🔥", "⭐", "🎁"].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setComboTier2Emoji(em)}
                              className="text-sm p-1 rounded-md hover:bg-stone-200/60 cursor-pointer"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Required Items Count</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={comboTier2Count}
                        onChange={(e) => setComboTier2Count(e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">Discount Percentage (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={comboTier2Discount}
                          onChange={(e) => setComboTier2Discount(e.target.value)}
                          placeholder="15"
                          className="w-full px-3 py-2 pr-7 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                        />
                        <span className="absolute right-3 top-2 text-stone-400 text-xs font-bold">%</span>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="block text-xs font-bold text-stone-700">Badge Text</label>
                      <input
                        type="text"
                        value={comboTier2Badge}
                        onChange={(e) => setComboTier2Badge(e.target.value)}
                        placeholder="✦ 15% OFF"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="block text-xs font-bold text-stone-700">Tagline / Instruction</label>
                      <input
                        type="text"
                        value={comboTier2Tagline}
                        onChange={(e) => setComboTier2Tagline(e.target.value)}
                        placeholder="Pick any 5 — save 15% on MRP"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ELIGIBLE PRODUCTS SELECTION SECTION */}
              <div className="rounded-2xl border-2 border-stone-200 bg-stone-50/50 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                          Included Products in Combos
                        </h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {previewSelectedProducts.length} of {catalogProducts.length} Available
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Choose which products from your store catalog customers can add to their combo bundle.
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAllComboProducts}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectFlavouredComboProducts}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-green/10 hover:bg-brand-green/15 text-brand-green border border-brand-green/20 transition-colors shadow-2xs cursor-pointer"
                    >
                      Flavours Only
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllComboProducts}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-rose-50 hover:text-rose-600 border border-stone-200 text-stone-500 transition-colors shadow-2xs cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {/* Product Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catalogProducts.map((product) => {
                    const active = isProductInCombo(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleToggleComboProduct(product.id)}
                        className={`cursor-pointer rounded-xl p-3 flex items-center gap-3 transition-all select-none border-2 ${
                          active
                            ? "bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/20"
                            : "bg-white/80 border-stone-200 hover:border-stone-300 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60 relative">
                          <Image
                            src={product.imageUrl || "/images/makhana_sig.jpg"}
                            alt={product.name}
                            width={56}
                            height={56}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{product.name}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            ₹{Math.round(product.basePrice / 100)} ·{" "}
                            <span className="text-stone-400 capitalize">{product.category || "Makhana"}</span>
                          </p>
                          <div className="mt-1.5">
                            {active ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Check size={11} className="stroke-[3]" /> In Combo
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                                Excluded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-500">
                  <Sparkles size={12} className="text-brand-green" />
                  <span>
                    Click any product card to toggle it in or out of the combo builder. Changes apply live once you save.
                  </span>
                </div>
              </div>

              {/* Action Button & Footer Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Shop Button Text</label>
                  <input
                    type="text"
                    value={comboButtonText}
                    onChange={(e) => setComboButtonText(e.target.value)}
                    placeholder="Shop My Combo"
                    maxLength={60}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Bottom Trust Note</label>
                  <input
                    type="text"
                    value={comboFooterNote}
                    onChange={(e) => setComboFooterNote(e.target.value)}
                    placeholder="✦ Combo discount applies to total MRP ✦ Multiples allowed ✦"
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                  />
                </div>
              </div>

              {/* LIVE REALISTIC PREVIEW (Matches screenshot aesthetic!) */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-brand-pink-accent" />
                    Live Website Visual Preview
                  </p>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Updates live as you type
                  </span>
                </div>

                {/* Dark Luxury Container simulating the exact section */}
                <div className="rounded-3xl overflow-hidden p-6 sm:p-10 text-center relative border border-white/10 shadow-2xl bg-gradient-to-br from-[#0d1a16] via-[#12261f] to-[#1a1a2e]">
                  <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                    {/* Eyebrow */}
                    <p className="text-brand-pink-accent text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      {comboEyebrow || "Make Your Own Combo"}
                      <Sparkles className="w-3.5 h-3.5" />
                    </p>

                    {/* Heading */}
                    <h2 className="font-serif text-3xl sm:text-5xl text-white leading-tight font-normal">
                      {comboTitlePrefix || "Curate Your"}{" "}
                      <span className="italic font-light bg-[linear-gradient(110deg,#E6B8C0,45%,#FDF2F4,55%,#E6B8C0)] bg-[length:200%_100%] text-transparent bg-clip-text">
                        {comboTitleHighlight || "Pink Farm Combo"}
                      </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="text-white/60 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                      {comboSubtitle ||
                        "Mix & match your favourite flavoured makhanas. Add multiple packs of any flavour — combo discounts apply directly on the original MRP!"}
                    </p>

                    {/* Tier Switcher Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPreviewTierTab(0)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs tracking-wide transition-all border ${
                          previewTierTab === 0
                            ? "bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green border-[#E6B8C0] shadow-[0_0_20px_rgba(230,184,192,0.45)] scale-105"
                            : "bg-white/5 border-white/10 text-white/60"
                        }`}
                      >
                        <span className="text-base">{comboTier1Emoji || "🌿"}</span>
                        <span>{comboTier1Label || "Trio Combo"}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            previewTierTab === 0 ? "bg-brand-green/20 text-brand-green" : "bg-white/10 text-white/50"
                          }`}
                        >
                          {comboTier1Badge || `✦ ${comboTier1Discount || 11}% OFF`}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewTierTab(1)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs tracking-wide transition-all border ${
                          previewTierTab === 1
                            ? "bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green border-[#E6B8C0] shadow-[0_0_20px_rgba(230,184,192,0.45)] scale-105"
                            : "bg-white/5 border-white/10 text-white/60"
                        }`}
                      >
                        <span className="text-base">{comboTier2Emoji || "🌸"}</span>
                        <span>{comboTier2Label || "Penta Combo"}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            previewTierTab === 1 ? "bg-brand-green/20 text-brand-green" : "bg-white/10 text-white/50"
                          }`}
                        >
                          {comboTier2Badge || `✦ ${comboTier2Discount || 15}% OFF`}
                        </span>
                      </button>
                    </div>

                    {/* Progress Bar simulator */}
                    <div className="space-y-2 max-w-sm mx-auto pt-2">
                      <p className="text-white/80 text-xs">
                        <span className="text-[#E6B8C0] font-bold">0</span>
                        <span className="text-white/40">
                          {" "}
                          / {previewTierTab === 0 ? comboTier1Count || 3 : comboTier2Count || 5} items chosen
                        </span>
                        {" · "}
                        <span className="text-white/70 italic">
                          {previewTierTab === 0
                            ? comboTier1Tagline || "Pick any 3 — save 11% on MRP"
                            : comboTier2Tagline || "Pick any 5 — save 15% on MRP"}
                        </span>
                      </p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] rounded-full" />
                      </div>
                      <p className="text-[11px] text-white/40">
                        Add{" "}
                        <span className="text-brand-pink-accent font-semibold">
                          {previewTierTab === 0 ? comboTier1Count || 3 : comboTier2Count || 5} more
                        </span>{" "}
                        items to unlock {previewTierTab === 0 ? comboTier1Discount || 11 : comboTier2Discount || 15}% off!
                      </p>
                    </div>

                    {/* Active Flavours in Visual Preview */}
                    <div className="pt-2 text-left bg-black/25 rounded-2xl p-4 border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                          Eligible Products ({previewSelectedProducts.length})
                        </p>
                        <span className="text-[9px] text-brand-pink-accent font-medium">
                          displayed in live combo builder
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {previewSelectedProducts.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-md overflow-hidden bg-white/10 shrink-0">
                              <Image
                                src={p.imageUrl || "/images/makhana_sig.jpg"}
                                alt={p.name}
                                width={28}
                                height={28}
                                unoptimized
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-white text-[11px] font-medium truncate">{p.name}</p>
                          </div>
                        ))}
                        {previewSelectedProducts.length > 4 && (
                          <div className="p-1.5 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-white/50 font-medium">
                            +{previewSelectedProducts.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary Button Preview */}
                    <div className="pt-4 flex flex-col items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-xs bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green shadow-lg">
                        <span>{comboButtonText || "Shop My Combo"}</span>
                        <ArrowRight size={14} />
                      </div>
                      <p className="text-[10px] text-white/40 tracking-wider">
                        {comboFooterNote || "✦ Combo discount applies to total MRP ✦ Multiples allowed ✦"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB: Store Categories Filter Bar                              */}
        {/* ------------------------------------------------------------ */}
        {(activeTab === "categories" || activeTab === "all") && (
          <div className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 pt-4 border-b border-stone-200 pb-2">
                <LayoutGrid size={18} className="text-brand-green" />
                <h2 className="text-base font-bold text-stone-900">Product Categories Bar</h2>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                    <LayoutGrid size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-stone-900">
                        Product Categories Filter Bar
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {storeCategories.length} Categories
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Configure the category tabs that customers click to filter products on your <span className="font-semibold text-stone-700">/products</span> page.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/categories"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-green text-white hover:brightness-95 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Open Category Manager</span>
                    <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} /> Reset Defaults
                  </button>
                </div>
              </div>

              {/* LIVE STOREFRONT CATEGORY BAR PREVIEW */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-brand-green" />
                    Live Storefront Filter Bar Preview
                  </p>
                  <span className="text-[11px] text-stone-400">Click any tab to test active state</span>
                </div>

                {/* Beige Bar Simulator identical to storefront */}
                <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <div className="flex gap-4 sm:gap-6 items-center flex-wrap">
                    {/* "All" is always first */}
                    <button
                      type="button"
                      onClick={() => setPreviewCategoryTab("all")}
                      className={`font-medium transition-colors relative py-1 text-sm sm:text-base cursor-pointer ${
                        previewCategoryTab === "all"
                          ? "text-brand-green font-bold"
                          : "text-brand-charcoal opacity-70 hover:text-brand-green"
                      }`}
                    >
                      <span>All</span>
                      {previewCategoryTab === "all" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-full" />
                      )}
                    </button>

                    {/* Configured Categories */}
                    {storeCategories.map((cat) => {
                      const isSelected = previewCategoryTab.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPreviewCategoryTab(cat)}
                          className={`font-medium transition-colors relative py-1 text-sm sm:text-base cursor-pointer ${
                            isSelected
                              ? "text-brand-green font-bold"
                              : "text-brand-charcoal opacity-70 hover:text-brand-green"
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-full" />
                          )}
                        </button>
                      );
                    })}

                    {/* Make a Combo Tab */}
                    {comboEnabled && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green bg-brand-pink/70 px-3 py-1 rounded-full border border-brand-pink-accent/40 shadow-2xs select-none">
                        <span>🌸</span> Make a Combo
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CURRENT CATEGORIES LIST */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Active Categories ({storeCategories.length})
                  </p>
                  <span className="text-[11px] text-stone-400">
                    Click the red trash icon to remove a category
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {storeCategories.map((cat) => {
                    const prodCount = products.filter(
                      (p) => p.category?.toLowerCase() === cat.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={cat}
                        className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-3.5 flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200/60 flex items-center justify-center text-brand-green shrink-0 shadow-2xs">
                            <Tag size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-stone-900 truncate">{cat}</p>
                            <p className="text-[11px] text-stone-500">
                              {prodCount} product{prodCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          title={`Delete ${cat}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADD NEW CATEGORY INPUT */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5 space-y-3">
                <label className="block text-xs font-bold text-stone-800">
                  Add New Category
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Enter category name (e.g. Gourmet Snacks, Roasted Makhana, Seeds)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory()}
                    disabled={!newCategoryInput.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>

                {/* Quick Suggested Chips */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] text-stone-500 font-medium">Quick suggestions:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      "Roasted Makhana",
                      "Gourmet Snacks",
                      "Seeds & Berries",
                      "Everyday Essentials",
                      "Healthy Sips",
                      "Gift Boxes",
                    ]
                      .filter((s) => !storeCategories.some((c) => c.toLowerCase() === s.toLowerCase()))
                      .slice(0, 4)
                      .map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddCategory(suggested)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus size={11} /> {suggested}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                <Sparkles size={13} className="text-brand-green" />
                <span>
                  Remember to click <strong className="text-stone-700">Save Changes</strong> to publish your category changes live across the storefront!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: Store Identity & Announcement Banner                  */}
        {/* ------------------------------------------------------------ */}
        {(activeTab === "store" || activeTab === "all") && (
          <div className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 pt-4 border-b border-stone-200 pb-2">
                <Store size={18} className="text-brand-green" />
                <h2 className="text-base font-bold text-stone-900">Store &amp; Brand Identity</h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Name & Announcement */}
              <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 transition-all hover:border-stone-300">
                <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                  <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Store Identity &amp; Header Banner
                    </h3>
                    <p className="text-xs text-stone-500">Configure your storefront title and top banner text</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Store Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Pink Farm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Top Announcement Banner Text</label>
                    <input
                      type="text"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="Welcome to Pink Farm — Goodness in Every Bite."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Inline Mini Live Preview */}
                <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/70 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <Sparkles size={12} className="text-brand-pink-accent" />
                    Live Announcement Banner Preview
                  </div>
                  <div className="bg-gradient-to-r from-brand-green to-brand-green-light text-brand-ivory text-center py-2.5 px-4 rounded-lg text-xs font-medium truncate shadow-2xs">
                    ✨ {announcementText || "Welcome to Pink Farm — Goodness in Every Bite."}
                  </div>
                </div>
              </div>

              {/* Bottom Announcement Banner (Fixed at Bottom) */}
              <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 transition-all hover:border-stone-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                        <Sliders size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                          Bottom Banner (Fixed)
                        </h3>
                        <p className="text-xs text-stone-500">Fixed announcement bar at the bottom of the screen</p>
                      </div>
                    </div>

                    {/* Enable / Remove Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        bottomAnnouncementEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        {bottomAnnouncementEnabled ? "Active" : "Removed"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer select-none" title={bottomAnnouncementEnabled ? "Click to remove banner" : "Click to enable banner"}>
                        <input
                          type="checkbox"
                          checked={bottomAnnouncementEnabled}
                          onChange={(e) => setBottomAnnouncementEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-stone-700">Bottom Announcement Text</label>
                      <div className="flex items-center gap-2">
                        {bottomAnnouncementEnabled && (
                          <button
                            type="button"
                            onClick={() => setBottomAnnouncementEnabled(false)}
                            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-semibold transition-colors cursor-pointer"
                            title="Remove the bottom banner according to admin wish"
                          >
                            <Trash2 size={12} />
                            Remove Banner
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setBottomAnnouncementText(DEFAULT_SETTINGS.bottomAnnouncementText);
                            setBottomAnnouncementEnabled(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                          title="Reset to default text and enable"
                        >
                          <RotateCcw size={12} />
                          Restore Default
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={bottomAnnouncementText}
                      onChange={(e) => setBottomAnnouncementText(e.target.value)}
                      placeholder="Welcome to Pink Farm — Goodness in Every Bite."
                      disabled={!bottomAnnouncementEnabled}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                        bottomAnnouncementEnabled
                          ? "border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-stone-900 bg-white"
                          : "border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed"
                      }`}
                    />
                    <p className="text-[11px] text-stone-500">
                      {bottomAnnouncementEnabled
                        ? "This message stays fixed at the bottom of the user's screen across all pages."
                        : "Banner is currently hidden/removed. Turn the toggle ON or click Restore to re-enable."}
                    </p>
                  </div>

                  {/* Inline Live Preview */}
                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/70 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Sparkles size={12} className="text-brand-pink-accent" />
                        Live Bottom Banner Preview
                      </span>
                      <span className={bottomAnnouncementEnabled ? "text-emerald-700" : "text-stone-400"}>
                        {bottomAnnouncementEnabled ? "● Visible on Storefront" : "○ Removed / Hidden"}
                      </span>
                    </div>
                    {bottomAnnouncementEnabled ? (
                      <div className="bg-gradient-to-r from-brand-green to-brand-green-light text-brand-ivory text-center py-2.5 px-4 rounded-lg text-xs font-medium truncate shadow-2xs">
                        ✨ {bottomAnnouncementText || "Welcome to Pink Farm — Goodness in Every Bite."}
                      </div>
                    ) : (
                      <div className="bg-stone-100/80 text-stone-400 border border-dashed border-stone-200 text-center py-2 px-3 rounded-lg text-xs italic">
                        Banner is removed according to admin wish. Switch toggle ON to display.
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span>Fixed to bottom of screen (print:hidden)</span>
                  <span>Click Save Changes to publish live</span>
                </div>
              </div>

              {/* Store Ordering Status Toggle */}
              <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 transition-all hover:border-stone-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isAcceptingOrders
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <Power size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                          Store Ordering Status
                        </h3>
                        <p className="text-xs text-stone-500">Enable or pause customer checkout</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAcceptingOrders}
                        onChange={(e) => setIsAcceptingOrders(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                    </label>
                  </div>

                  <div
                    className={`p-4 rounded-xl text-xs sm:text-sm font-medium border leading-relaxed ${
                      isAcceptingOrders
                        ? "bg-emerald-50/80 text-emerald-900 border-emerald-200"
                        : "bg-amber-50/80 text-amber-900 border-amber-200"
                    }`}
                  >
                    {isAcceptingOrders ? (
                      <div className="space-y-1">
                        <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <span>●</span> Store is Online &amp; Open
                        </p>
                        <p className="text-xs text-emerald-700">
                          Customers can browse, add items to their cart, and complete secure online payments.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-amber-800 flex items-center gap-1.5">
                          <span>⚠️</span> Orders Temporarily Paused
                        </p>
                        <p className="text-xs text-amber-700">
                          Browsing remains active, but cart checkout will display a polite maintenance notice preventing new transactions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                  Changes take effect immediately upon clicking Save Changes.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: Delivery Fees, Shipping Rules & Support Contacts     */}
        {/* ------------------------------------------------------------ */}
        {(activeTab === "operations" || activeTab === "all") && (
          <div className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 pt-4 border-b border-stone-200 pb-2">
                <Truck size={18} className="text-brand-green" />
                <h2 className="text-base font-bold text-stone-900">Delivery &amp; Customer Support</h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Fees & Free Shipping */}
              <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 transition-all hover:border-stone-300">
                <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Shipping &amp; Delivery Rules
                    </h3>
                    <p className="text-xs text-stone-500">Standard delivery fee and free shipping eligibility</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Standard Delivery Fee (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={deliveryFeeRupees}
                        onChange={(e) => setDeliveryFeeRupees(e.target.value)}
                        placeholder="50"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Free Delivery Above (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={freeThresholdRupees}
                        onChange={(e) => setFreeThresholdRupees(e.target.value)}
                        placeholder="500"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3.5 text-xs text-orange-950 flex items-center justify-between">
                  <span>
                    📦 <strong>Active Shipping Rule:</strong> ₹{deliveryFeeRupees || 0} flat fee applies to orders below ₹{freeThresholdRupees || 0}. Orders of ₹{freeThresholdRupees || 0}+ receive <strong>FREE Shipping</strong>.
                  </span>
                </div>
              </div>

              {/* Customer Support & Contacts */}
              <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 transition-all hover:border-stone-300">
                <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Customer Support &amp; Contacts
                    </h3>
                    <p className="text-xs text-stone-500">Contact details shown on footer, invoices &amp; help pages</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Phone size={12} className="text-stone-400" /> Support Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      placeholder="+91 8437504040"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Mail size={12} className="text-stone-400" /> Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="wecare@pinkfarm.in"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <MapPin size={12} className="text-stone-400" /> Registered Business Address
                    </label>
                    <textarea
                      rows={2}
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Dugri, Ludhiana, Punjab - 141003"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm resize-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-stone-400" /> FSSAI License / Registration Number
                      </span>
                      <span className="text-[10px] font-normal text-stone-400">14-Digit Format</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/fssai-logo.png"
                          alt="FSSAI"
                          className="h-4 w-auto object-contain"
                        />
                      </div>
                      <input
                        type="text"
                        value={fssaiNumber}
                        onChange={(e) => setFssaiNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 14))}
                        placeholder="22126026000144"
                        maxLength={14}
                        className="w-full pl-14 pr-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 text-sm font-mono transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 leading-normal">
                      Display format on website: <span className="font-mono font-semibold text-stone-700">Lic. No. {fssaiNumber || "22126026000144"}</span> alongside the official FSSAI emblem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 4: Founder Story (About Us Page)                         */}
        {/* ------------------------------------------------------------ */}
        {(activeTab === "founder" || activeTab === "all") && (
          <div className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 pt-4 border-b border-stone-200 pb-2">
                <HeartHandshake size={18} className="text-brand-green" />
                <h2 className="text-base font-bold text-stone-900">Founder Story</h2>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 transition-all hover:border-stone-300">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Founder Profile &amp; Story (About Us Page)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Share your authentic farming journey, mission statement, and personal portrait photo.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] items-start">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Founder Name</label>
                    <input
                      value={founderName}
                      onChange={(event) => setFounderName(event.target.value)}
                      maxLength={100}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Role / Title</label>
                    <input
                      value={founderRole}
                      onChange={(event) => setFounderRole(event.target.value)}
                      maxLength={120}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700">Story Paragraph 1</label>
                    <textarea
                      value={founderStoryFirst}
                      onChange={(event) => setFounderStoryFirst(event.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700">Story Paragraph 2</label>
                    <textarea
                      value={founderStorySecond}
                      onChange={(event) => setFounderStorySecond(event.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700">Personal Quote / Creed</label>
                    <textarea
                      value={founderQuote}
                      onChange={(event) => setFounderQuote(event.target.value)}
                      maxLength={500}
                      rows={2}
                      className="w-full resize-y rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700">
                      Profile Tags (one per line, up to 12)
                    </label>
                    <textarea
                      value={founderTagsText}
                      onChange={(event) => setFounderTagsText(event.target.value)}
                      rows={3}
                      placeholder="Certified Organic&#10;Zero Preservatives&#10;Direct from Farmers"
                      className="w-full resize-y rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Portrait Upload Box */}
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-stone-50/80 p-5 text-center border border-stone-200/70">
                  <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-brand-pink to-brand-cream shadow-md">
                    {founderImage ? (
                      <Image src={founderImage} alt="Founder portrait preview" width={144} height={144} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-6xl" aria-hidden="true">👩‍💼</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full pt-1">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-green px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-green-dark shadow-xs">
                      <ImagePlus size={14} /> Upload Portrait
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => void handleHeroImageUpload(event, setFounderImage)}
                      />
                    </label>
                    {founderImage && (
                      <button
                        type="button"
                        onClick={() => setFounderImage("")}
                        className="inline-flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-200/60 cursor-pointer"
                      >
                        <RotateCcw size={13} /> Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-400">
                    Square or portrait photo. Automatically optimized before saving.
                  </p>
                </div>
              </div>

              {/* Founder Live Preview */}
              <div className="rounded-2xl border border-brand-pink/40 bg-brand-pink/20 p-5 sm:p-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                  Live Preview (About Us Page)
                </p>
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="mx-auto sm:mx-0 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
                    {founderImage ? (
                      <Image src={founderImage} alt="" width={96} height={96} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl" aria-hidden="true">👩‍💼</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h4 className="font-serif text-2xl text-brand-green font-bold">
                      Meet <span className="italic">{founderName || DEFAULT_SETTINGS.founderName}.</span>
                    </h4>
                    <p className="text-xs font-semibold text-brand-green/80">
                      {founderRole || DEFAULT_SETTINGS.founderRole}
                    </p>
                    <p className="line-clamp-2 text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed">
                      {founderStoryFirst || DEFAULT_SETTINGS.founderStoryFirst}
                    </p>
                    <p className="font-serif text-xs italic text-brand-green">
                      “{founderQuote || DEFAULT_SETTINGS.founderQuote}”
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
                      {founderTagsText
                        .split("\n")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .slice(0, 12)
                        .map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-brand-green shadow-2xs border border-brand-pink-accent/30"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Save Card at Bottom of Settings */}
        {activeTab !== "coupons" && (
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-stone-600 font-medium">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-bold text-stone-900 text-sm">Save your configurations?</p>
                <p className="text-stone-500 text-xs">
                  Updated settings apply immediately to your database and customer-facing store.
                </p>
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={14} className="text-emerald-300" />
              ) : (
                <Save size={14} />
              )}
              <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}</span>
            </motion.button>
          </div>
        )}
      </form>

      {/* ------------------------------------------------------------ */}
      {/* TAB 5: Coupon & Discount Management (Full Width)             */}
      {/* ------------------------------------------------------------ */}
      {(activeTab === "coupons" || activeTab === "all") && (
        <section
          id="settings-coupons"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 transition-all hover:border-stone-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                <TicketPercent size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Coupon &amp; Discount Codes
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green">
                    {coupons.filter((c) => c.isActive).length} Active
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Create discount codes with minimum order amounts, caps, validity windows, and usage limits.
                </p>
              </div>
            </div>

            {editingCouponId && (
              <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 self-start sm:self-auto">
                Editing Coupon #{editingCouponId.slice(0, 8)}...
              </span>
            )}
          </div>

          {/* Coupon Form Fields */}
          <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/70 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Coupon Code</span>
                <input
                  value={couponDraft.code}
                  onChange={(e) =>
                    setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. WELCOME10"
                  maxLength={32}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Discount Type</span>
                <select
                  value={couponDraft.discountType}
                  onChange={(e) =>
                    setCouponDraft({
                      ...couponDraft,
                      discountType: e.target.value as CouponDraft["discountType"],
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                >
                  <option value="FIXED">Fixed Amount (₹)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </label>

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>
                  {couponDraft.discountType === "FIXED"
                    ? "Discount Amount (₹)"
                    : "Discount Percentage (%)"}
                </span>
                <input
                  type="number"
                  min="1"
                  max={couponDraft.discountType === "PERCENTAGE" ? 100 : undefined}
                  value={couponDraft.discountValue}
                  onChange={(e) => setCouponDraft({ ...couponDraft, discountValue: e.target.value })}
                  placeholder={couponDraft.discountType === "FIXED" ? "50" : "10"}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Min Order Subtotal (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={couponDraft.minimumSubtotal}
                  onChange={(e) => setCouponDraft({ ...couponDraft, minimumSubtotal: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {couponDraft.discountType === "PERCENTAGE" ? (
                <label className="space-y-1.5 text-xs font-bold text-stone-700">
                  <span>Maximum Discount Cap (₹)</span>
                  <input
                    type="number"
                    min="1"
                    value={couponDraft.maximumDiscount}
                    onChange={(e) => setCouponDraft({ ...couponDraft, maximumDiscount: e.target.value })}
                    placeholder="e.g. 200"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                  />
                </label>
              ) : null}

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Starts At</span>
                <input
                  type="datetime-local"
                  value={couponDraft.startsAt}
                  onChange={(e) => setCouponDraft({ ...couponDraft, startsAt: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Expires At (optional)</span>
                <input
                  type="datetime-local"
                  value={couponDraft.expiresAt}
                  onChange={(e) => setCouponDraft({ ...couponDraft, expiresAt: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Total Redemptions (optional)</span>
                <input
                  type="number"
                  min="1"
                  value={couponDraft.usageLimit}
                  onChange={(e) => setCouponDraft({ ...couponDraft, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold text-stone-700">
                <span>Uses Per Customer (optional)</span>
                <input
                  type="number"
                  min="1"
                  value={couponDraft.perCustomerLimit}
                  onChange={(e) => setCouponDraft({ ...couponDraft, perCustomerLimit: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-200/80">
              <div className="flex flex-wrap items-center gap-5 text-xs text-stone-700">
                <label className="flex items-center gap-2 cursor-pointer font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={couponDraft.firstOrderOnly}
                    onChange={(e) => setCouponDraft({ ...couponDraft, firstOrderOnly: e.target.checked })}
                    className="rounded border-stone-300 text-brand-green focus:ring-brand-green"
                  />
                  <span>First Order Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={couponDraft.isActive}
                    onChange={(e) => setCouponDraft({ ...couponDraft, isActive: e.target.checked })}
                    className="rounded border-stone-300 text-brand-green focus:ring-brand-green"
                  />
                  <span>Active &amp; Redeemable</span>
                </label>
              </div>

              <div className="flex items-center gap-2.5">
                {editingCouponId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponDraft(emptyCoupon);
                      setEditingCouponId(null);
                    }}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void saveCoupon()}
                  disabled={couponBusy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green hover:bg-brand-green-dark px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {couponBusy ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <TicketPercent size={13} />
                  )}
                  <span>{couponBusy ? "Saving…" : editingCouponId ? "Update Coupon" : "Add Coupon"}</span>
                </button>
              </div>
            </div>

            {couponMessage && (
              <p
                role="status"
                className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl"
              >
                {couponMessage}
              </p>
            )}
          </div>

          {/* Existing Coupons Table / Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Active &amp; Configured Coupons ({coupons.length})
            </h4>

            {coupons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center bg-stone-50/50">
                <TicketPercent size={32} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-bold text-stone-600">No coupons created yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Use the coupon form above to create your first discount or promotional coupon code.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {coupons.map((coupon) => (
                  <motion.div
                    key={coupon.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                      coupon.id === editingCouponId
                        ? "border-brand-green bg-brand-green/5 shadow-xs"
                        : "border-stone-200/90 bg-white hover:border-stone-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm tracking-wider text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                          {coupon.code}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            coupon.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-stone-100 text-stone-500 border border-stone-200"
                          }`}
                        >
                          {coupon.isActive ? "● Active" : "○ Inactive"}
                        </span>
                        {coupon.firstOrderOnly && (
                          <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold border border-blue-200">
                            First Order
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-brand-green">
                        {coupon.discountType === "FIXED"
                          ? `₹${(coupon.discountValue / 100).toFixed(0)} FLAT OFF`
                          : `${coupon.discountValue}% OFF${
                              coupon.maximumDiscount
                                ? ` (up to ₹${(coupon.maximumDiscount / 100).toFixed(0)})`
                                : ""
                            }`}
                      </p>

                      <p className="text-[11px] text-stone-500">
                        Min spend ₹{(coupon.minimumSubtotal / 100).toFixed(0)} · Used {coupon.usedCount}
                        {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                        {coupon.expiresAt ? ` · Exp: ${new Date(coupon.expiresAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => editCoupon(coupon)}
                        aria-label={`Edit ${coupon.code}`}
                        className="rounded-xl p-2.5 text-stone-600 hover:text-brand-green hover:bg-brand-green/10 transition-colors cursor-pointer"
                        title="Edit coupon"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCoupon(coupon.id)}
                        aria-label={`Delete ${coupon.code}`}
                        className="rounded-xl p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* FLOATING QUICK SAVE BUTTON (Always accessible without scrolling) */}
      {/* ============================================================== */}
      {activeTab !== "coupons" && (
        <div className="fixed bottom-5 right-5 z-40 print:hidden">
          <motion.button
            onClick={() => handleSave()}
            disabled={isSaving}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer disabled:opacity-60 border-2 border-white/20"
            title="Save changes to store settings"
          >
            {isSaving ? (
              <RefreshCw size={15} className="animate-spin text-white" />
            ) : saveSuccess ? (
              <CheckCircle2 size={15} className="text-emerald-300" />
            ) : (
              <Save size={15} />
            )}
            <span>{isSaving ? "Saving…" : saveSuccess ? "Saved!" : "Save Changes"}</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
