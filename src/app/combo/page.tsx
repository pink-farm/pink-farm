import { Metadata } from "next";
import ComboBuilder from "@/components/products/ComboBuilder";
import { getCachedStoreProducts, getCachedStoreSettings } from "@/lib/cachedStore";
import { pickComboProductData } from "@/lib/mediaUrl";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedStoreSettings();
  const title = `${settings.comboTitlePrefix || "Curate Your"} ${settings.comboTitleHighlight || "Pink Farm Combo"} | ${settings.storeName || "Pink Farm"}`;
  const description = settings.comboSubtitle || "Build your custom combo of delicious makhana snacks and unlock exclusive bundle discounts.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function ComboPage() {
  const [products] = await Promise.all([getCachedStoreProducts()]);
  const comboProducts = products.map(pickComboProductData);

  return (
    <div className="min-h-screen bg-[#0d1a16] flex flex-col justify-center pb-28 sm:pb-16 min-w-0 w-full">
      <ComboBuilder products={comboProducts} />
    </div>
  );
}
