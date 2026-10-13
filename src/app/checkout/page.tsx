import { CheckoutClient } from "./CheckoutClient";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Checkout | Pink Farm",
};

export const instant = false;

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-brand-charcoal opacity-70 mb-8">
        <Link href="/cart" className="hover:text-brand-green">Cart</Link>
        <ChevronRight size={14} />
        <span className="text-brand-green font-medium">Checkout</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl text-brand-green mb-10">Checkout</h1>
      
      <CheckoutClient />
    </div>
  );
}
