import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock, Package, Truck, Home, Printer } from "lucide-react";
import { CuteAnimatedGiftIcon } from "@/components/checkout/CuteSurpriseGift";



export const instant = false;

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  
  let order;
  try {
    order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber },
      include: { items: { include: { product: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch order", error);
  }

  if (!order) {
    notFound();
  }

  const isSuccess = order.paymentStatus === "PAID" || order.paymentMethod === "COD";

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-brand-green-light/10 text-center mb-8">
        {isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-brand-green/20 rounded-full animate-ping"></div>
              <CheckCircle2 className="relative w-24 h-24 text-brand-green bg-white rounded-full" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-brand-green mb-4">Get Ready for Some Goodness!</h1>
            <p className="text-xl text-brand-green font-medium mb-2">We are so grateful for your order, {order.customerName}.</p>
            <p className="text-brand-charcoal/80 text-lg max-w-lg mb-8 leading-relaxed">
              Your order has been successfully placed, and Pink Farm&apos;s team is already getting it ready with love and care. We can&apos;t wait for you to experience it.
            </p>
            
            <div className="w-full bg-brand-pink/20 rounded-2xl p-6 border border-brand-pink mt-2">
              <p className="text-brand-green font-serif text-lg mb-4">While you wait for your goodness to arrive...</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href="https://instagram.com/pinkfarm.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white px-6 py-3 rounded-full font-bold shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Join our Instagram Family
                </a>
                
                <a 
                  href="https://www.youtube.com/@pinkfarm.official" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 bg-[#FF0000] text-white px-6 py-3 rounded-full font-bold shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  Watch our Pink Farm Channel
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
             <Clock className="w-20 h-20 text-yellow-500 mb-6" />
             <h1 className="font-serif text-3xl md:text-4xl text-brand-green mb-4">Payment Pending</h1>
             <p className="text-lg opacity-80 mb-2">We are waiting for your payment to be confirmed.</p>
             <p className="opacity-70">If your money was deducted, please wait a few minutes and refresh.</p>
          </div>
        )}
      </div>

      {isSuccess && (
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200 mb-8 flex flex-col md:flex-row items-center gap-6 text-left">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📹</span>
          </div>
          <div>
            <h3 className="font-serif text-xl text-brand-green mb-2">A tiny request from us!</h3>
            <p className="text-brand-charcoal/80 text-sm leading-relaxed">
              To ensure full transparency and help us serve you better, please make a small, uncut unboxing video when you receive your package. This helps us quickly resolve any issues in the rare case of transit damage.
            </p>
          </div>
        </div>
      )}

      <div className="bg-brand-cream rounded-3xl p-8 md:p-12 border border-brand-green-light/10 mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-6 border-b border-brand-green-light/20 gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/lotus-logo-gold.png" 
              alt="Pink Farm Logo" 
              width={70} 
              height={70} 
              className="w-14 h-14 object-contain -translate-y-[4%] -mr-1"
            />
            <div className="flex flex-col">
              <span 
                className="font-serif text-3xl font-extrabold text-brand-green tracking-tight leading-none"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Pink Farm
              </span>
              <span className="text-[10px] text-brand-green/75 font-sans font-medium tracking-wider mt-0.5">
                By Suvana Organics
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="font-bold text-brand-green text-lg">Order #{order.orderNumber}</h2>
            <p className="text-xs opacity-70 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
            <div className="mt-1.5 flex items-center gap-2 sm:justify-end">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 
                order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.paymentMethod === "COD" ? "COD · DUE ON DELIVERY" : order.paymentStatus}
              </span>
              <span className="text-xs opacity-75 font-medium">· {order.fulfillmentStatus}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <span className="font-bold w-6">{item.quantity}x</span>
                <div>
                   <Link href={`/products`} className="font-medium text-brand-green hover:underline">{item.product.name}</Link>
                   {item.variantName && <p className="text-xs opacity-70">{item.variantName}</p>}
                </div>
              </div>
              <span className="font-medium">₹{(item.subtotal / 100).toFixed(2)}</span>
            </div>
          ))}

          {/* Surprise Gift Entry */}
          <div className="flex justify-between items-center bg-gradient-to-r from-pink-50/90 via-rose-50/50 to-amber-50/60 p-3 rounded-2xl border border-pink-200/80">
            <div className="flex gap-3 items-center">
              <span className="font-bold text-xs bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-xs">1x</span>
              <div className="flex items-center gap-2.5">
                <div className="bg-white p-0.5 rounded-xl border border-pink-200 shadow-xs">
                  <CuteAnimatedGiftIcon size="sm" interactive={false} />
                </div>
                <div>
                  <span className="font-medium text-brand-green text-sm flex items-center gap-1.5 font-bold">
                    Surprise Gift 🎁
                    <span className="text-[10px] font-sans font-extrabold uppercase bg-rose-500 text-white px-1.5 py-0.2 rounded-full">Free</span>
                  </span>
                  <p className="text-[11px] text-brand-charcoal/70">Complimentary handpicked treat inside your box</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-right">
              <span className="text-xs text-brand-charcoal/40 line-through">₹149.00</span>
              <span className="font-bold text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">FREE</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-brand-green-light/20 pt-6 text-sm">
          <div className="flex justify-between opacity-80">
            <span>Subtotal</span>
            <span>₹{(order.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Surprise Gift 🎁 (1x)</span>
            <span className="font-bold">FREE</span>
          </div>
          <div className="flex justify-between opacity-80">
            <span>Delivery</span>
            <span>₹{(order.deliveryFee / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-brand-green pt-4">
            <span>{order.paymentMethod === "COD" ? "Total due on delivery" : "Total paid"}</span>
            <span>₹{(order.totalAmount / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-brand-green-light/10 mb-8">
        <h3 className="font-bold text-lg text-brand-green mb-4">Delivery Details</h3>
        <p className="opacity-90">{order.customerName}</p>
        <p className="opacity-90">{order.addressLine1}</p>
        {order.addressLine2 && <p className="opacity-90">{order.addressLine2}</p>}
        <p className="opacity-90">{order.city}, {order.state} - {order.pinCode}</p>
        <p className="opacity-90 mt-2">Mobile: {order.customerPhone}</p>
      </div>

      <div className="bg-brand-cream/50 rounded-3xl p-8 border border-brand-green-light/10 mb-8 text-center space-y-4">
        <h3 className="font-serif text-xl text-brand-green">What happens next?</h3>
        <p className="text-sm opacity-70 leading-relaxed max-w-lg mx-auto">
          We are carefully packing your order with love. You will receive an email and WhatsApp message with your tracking details once your package is dispatched.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
          <div className="space-y-1 bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-brand-green font-medium">
              <Package size={16} /> Dispatch
            </div>
            <p className="text-xs opacity-80 pl-6">Within 24 Hours</p>
          </div>
          <div className="space-y-1 bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-brand-green font-medium">
              <Truck size={16} /> Shipping
            </div>
            <p className="text-xs opacity-80 pl-6">PAN-India Delivery</p>
          </div>
          <div className="space-y-1 bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-brand-green font-medium">
              <Home size={16} /> Surprise
            </div>
            <p className="text-xs opacity-80 pl-6">Free Gift Included 🎁</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild variant="outline" className="border-brand-green w-full sm:w-auto">
          <Link href={`/order/${order.orderNumber}/receipt`} target="_blank">
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt / Invoice
          </Link>
        </Button>
        <Button asChild className="bg-brand-green text-white hover:bg-brand-green-light w-full sm:w-auto">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
