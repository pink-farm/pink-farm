"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, Trash2, ArrowRight, Truck, CheckCircle2, AlertTriangle, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScaleOnTap, FadeIn, ShimmerSheen } from "@/components/ui/MotionWrappers";
import { formatPrice } from "@/lib/utils";
import { CuteAnimatedGiftIcon } from "@/components/checkout/CuteSurpriseGift";
import { useCustomerStore } from "@/store/customerStore";
import { CouponCodeSection } from "@/components/checkout/CouponCodeSection";

export default function CartPage() {
  const { items, updateQuantity, removeItem, appliedCoupon } = useCartStore();
  const isLoggedIn = useCustomerStore((state) => state.isLoggedIn);
  const deliveryFeeSetting = useSettingsStore((state) => state.deliveryFee);
  const freeDeliveryThreshold = useSettingsStore((state) => state.freeDeliveryThreshold);
  const isAcceptingOrders = useSettingsStore((state) => state.isAcceptingOrders);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : (deliveryFeeSetting ?? 5000)) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-brand-cream rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 text-brand-green/30"
        >
          <Trash2 size={40} />
        </motion.div>
        <h1 className="font-serif text-3xl text-brand-green mb-4">Your cart is empty</h1>
        <p className="text-brand-charcoal opacity-70 mb-8">Looks like you haven&apos;t added any goodness to your cart yet.</p>
        <ScaleOnTap>
          <Button asChild size="lg">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </ScaleOnTap>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <FadeIn direction="down">
        <h1 className="font-serif text-3xl md:text-4xl text-brand-green mb-10">Your Shopping Cart</h1>
      </FadeIn>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-[2] space-y-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div 
                key={`${item.id}-${item.variantId}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-brand-green-light/10 shadow-sm relative"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-brand-cream relative overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-green/30">Image</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <Link href={`/products/${item.slug}`} className="font-serif text-lg md:text-xl text-brand-green hover:text-brand-green-light hover:underline font-bold">
                        {item.name}
                      </Link>
                      <button onClick={() => removeItem(item.id, item.variantId)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {item.variantName && (
                      <p className="text-sm opacity-70 mt-1">Pack Size: {item.variantName}</p>
                    )}
                    <p className="font-bold text-brand-green mt-2">₹{formatPrice(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-brand-green-light/30 rounded-lg overflow-hidden h-10 bg-brand-cream">
                      <button 
                        onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                        className="px-3 h-full flex items-center justify-center hover:bg-white active:scale-95 transition-transform"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                        className="px-3 h-full flex items-center justify-center hover:bg-white active:scale-95 transition-transform"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-bold">₹{((item.price * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Complimentary Surprise Gift Banner in Cart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50/70 to-amber-50/80 border border-pink-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="shrink-0 bg-white p-1 rounded-xl border border-pink-200 shadow-xs">
                <CuteAnimatedGiftIcon size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-sm text-brand-green">Surprise Gift Included! 🎁</h3>
                  <span className="text-[10px] font-extrabold uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-brand-charcoal/75 mt-0.5">
                  A complimentary treat is automatically included with every order. Listed at checkout!
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              ₹0 (Free)
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex-1">
          <FadeIn direction="left">
            <div className="bg-brand-cream p-6 md:p-8 rounded-3xl sticky top-24">
              <h2 className="font-serif text-2xl text-brand-green mb-4">Order Summary</h2>

              {freeDeliveryThreshold > 0 && (
                <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${isFreeDelivery ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-brand-pink/30 text-brand-green border border-brand-pink/40"}`}>
                  {isFreeDelivery ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <Truck size={16} className="text-brand-green shrink-0" />}
                  <span>
                    {isFreeDelivery
                      ? "You qualify for FREE Delivery! 🎉"
                      : `Add ₹${Math.max(1, Math.ceil((freeDeliveryThreshold - subtotal) / 100))} more for FREE Delivery!`}
                  </span>
                </div>
              )}

              <CouponCodeSection subtotal={subtotal} />
              
              <div className="space-y-4 text-sm opacity-90 mb-6 pb-6 border-b border-brand-green-light/20">
                <div className="flex justify-between">
                  <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span>₹{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span>Surprise Gift 🎁</span>
                    <span className="text-[10px] bg-pink-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">Included</span>
                  </span>
                  <span className="font-bold">FREE</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-₹{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${formatPrice(deliveryFee)}`}</span>
                </div>
              </div>
              
              <div className="flex justify-between font-bold text-xl text-brand-green mb-6">
                <span>Total</span>
                <span>₹{formatPrice(total)}</span>
              </div>

              {/* Guest Checkout Disclaimer Notice if not logged in */}
              {!isLoggedIn && (
                <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Guest Checkout Disclaimer</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Ordering as a guest means you <strong>won&apos;t be able to track your package live</strong>, view order history, or access past receipts.
                  </p>
                  <div className="pt-0.5">
                    <Link 
                      href="/login?redirect=/checkout" 
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Log in / Sign up to enable tracking</span> &rarr;
                    </Link>
                  </div>
                </div>
              )}
              
              {isAcceptingOrders ? (
                <ScaleOnTap>
                  <ShimmerSheen className="rounded-md">
                    <Button asChild size="lg" className="w-full text-base h-14">
                      <Link href="/checkout">
                        Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </ShimmerSheen>
                </ScaleOnTap>
              ) : (
                <div className="space-y-2">
                  <Button disabled size="lg" className="w-full text-base h-14 opacity-60 cursor-not-allowed">
                    Orders Temporarily Paused
                  </Button>
                  <p className="text-center text-xs text-amber-700 font-medium">
                    Store ordering is temporarily paused by admin.
                  </p>
                </div>
              )}
              
              <div className="mt-5 text-center text-xs opacity-80 flex flex-col gap-1">
                <p className="font-semibold text-brand-green">🔒 100% Secure Checkout • UPI &amp; Cards</p>
                <p className="text-[11px] text-brand-charcoal/70">
                  {isLoggedIn 
                    ? "✓ Logged in • Your order will be linked to your account for live tracking" 
                    : "Guest checkout supported • Logging in recommended for tracking"}
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
