import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PrintControls from "@/app/admin/(authenticated)/orders/[id]/slip/PrintControls";
import { getCustomerSession } from "@/lib/auth";
import { canAccessOrderReference } from "@/lib/session-policy.mjs";
import type { Prisma, StoreSettings } from "@prisma/client";
import { logServerError } from "@/lib/server-log.mjs";

export const instant = false;

export default async function CustomerReceiptPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  let order: Prisma.OrderGetPayload<{ include: { items: { include: { product: true } } } }> | null = null;
  let settings: StoreSettings | null = null;

  try {
    order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });
  } catch (error) {
    logServerError("security.customer_receipt.load_failed", error);
  }

  if (!order) {
    notFound();
  }
  const customerSession = await getCustomerSession();
  if (!canAccessOrderReference(orderNumber, customerSession?.userId, order.customerId)) notFound();

  if (order.paymentStatus !== "PAID" || order.fulfillmentStatus === "CANCELLED") {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-amber-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700" aria-hidden="true">₹</div>
          <h1 className="font-serif text-2xl font-bold text-brand-green">Receipt unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-brand-charcoal/75">
            {order.fulfillmentStatus === "CANCELLED"
              ? "This order was cancelled, so a payment receipt cannot be issued."
              : "A receipt will be available after payment is completed and confirmed."}
          </p>
          <Link href={`/order/${encodeURIComponent(order.orderNumber)}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-green-light">
            Back to order details
          </Link>
        </div>
      </main>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const orderTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 text-gray-900 print:p-0 print:m-0 print:max-w-none">
      {/* Screen controls - hidden on print */}
      <PrintControls
        orderNumber={order.orderNumber}
        backUrl={`/order/${order.orderNumber}`}
        backLabel="Back to Order Details"
      />

      {/* The Printable Package Receipt (Amazon / Flipkart Style) */}
      <div className="bg-white border-2 border-black p-5 sm:p-7 rounded-none shadow-sm print:border-2 print:border-black print:p-5 print:shadow-none print:m-0 print:max-w-none print:break-inside-avoid text-black">
        
        {/* Top Header: Brand Trademark + Document Title */}
        <div className="border-b-2 border-black pb-3 mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image
              src="/lotus-logo-gold-tight.png"
              alt="Pink Farm Trademark Logo"
              width={140}
              height={150}
              priority
              unoptimized
              className="w-20 h-21 sm:w-24 sm:h-26 object-contain shrink-0"
            />
            <div>
              <h1 
                className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-[#1A3C34] print:text-[#1A3C34]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: "#1A3C34", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
              >
                Pink Farm
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-600 mt-1 pl-0.5">
                By Suvana Organics <span className="opacity-40 mx-1">·</span> Goodness in Every Bite
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-block bg-black text-white font-mono font-bold text-[11px] uppercase px-2.5 py-0.5 tracking-wider">
              Package Dispatch Slip &amp; Tax Invoice
            </span>
            <div className="mt-1 font-mono text-xs">
              <span className="text-gray-600">Order ID: </span>
              <span className="font-extrabold text-sm text-black break-all">{order.orderNumber}</span>
            </div>
            <div className="text-[10px] text-gray-600">
              {orderDate} at {orderTime}
            </div>
          </div>
        </div>

        {/* Dispatch & Delivery Boxes (Amazon/Flipkart Double-Box Format) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-2 border-black mb-3.5">
          
          {/* SHIP TO (Customer Details - Large & Prominent for Courier) */}
          <div className="md:col-span-8 p-3.5 border-b-2 md:border-b-0 md:border-r-2 border-black bg-gray-50/50 print:bg-transparent">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              DELIVER TO / CONSIGNEE (CUSTOMER)
            </div>
            <div className="text-base font-black text-black leading-snug">
              {order.customerName}
            </div>
            <div className="text-xs font-bold text-black mt-0.5">
              📞 Phone: {order.customerPhone}
            </div>

            {/* Address */}
            <div className="mt-1.5 text-xs leading-relaxed text-black">
              <div className="font-medium">{order.addressLine1}</div>
              {order.addressLine2 && (
                <div className="font-medium">{order.addressLine2}</div>
              )}
              <div className="font-bold mt-0.5 text-xs">
                {order.city}, {order.state}
              </div>
            </div>

            {/* PIN Code Badge */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-block border-2 border-black bg-white px-2 py-0.5 font-mono font-black text-xs tracking-widest">
                PIN: {order.pinCode}
              </span>
              <span className="inline-block text-[10px] font-bold text-gray-700 uppercase bg-gray-200 px-2 py-0.5 rounded">
                Prepaid Parcel
              </span>
            </div>

            {/* Special Instructions (if any) */}
            {order.deliveryInstructions && (
              <div className="mt-2 p-1.5 bg-yellow-50 border border-yellow-300 text-yellow-950 text-[11px] rounded print:border-black print:bg-transparent">
                <span className="font-bold">⚠️ Delivery Note: </span>
                {order.deliveryInstructions}
              </div>
            )}
          </div>

          {/* SENDER / RETURN TO (Store Origin Hub) */}
          <div className="md:col-span-4 p-3.5 text-xs flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                DISPATCHED FROM / RETURN TO
              </div>
              <div className="font-bold text-xs text-black">
                {settings?.storeName || "Pink Farm"} &bull; Anjali
              </div>
              <div className="text-[11px] text-gray-700 leading-relaxed mt-0.5">
                {settings?.businessAddress || "Dugri, Ludhiana, Punjab - 141003"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/fssai-logo.png"
                  alt="FSSAI"
                  className="h-3.5 w-auto object-contain"
                />
                <span className="text-[10px] font-mono font-bold text-gray-800">
                  Lic. No. {settings?.fssaiNumber || "22126026000144"}
                </span>
              </div>
              <div className="mt-1.5 text-[10px] text-gray-800">
                <div>✉️ {settings?.supportEmail || "wecare@pinkfarm.in"}</div>
                <div>📞 {settings?.supportPhone || "+91 8437504040"}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-300 text-[10px] text-gray-500 mt-2">
              <div>Mode: Standard Express</div>
              <div>Payment: <span className="font-bold text-black">{order.paymentStatus}</span></div>
            </div>
          </div>
        </div>

        {/* Itemized Contents Table */}
        <div className="mb-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-black mb-1 flex justify-between items-center">
            <span>Package Contents ({order.items.length} {order.items.length === 1 ? "Item" : "Items"})</span>
            <span className="text-[9px] font-normal text-gray-600">All prices in INR (₹)</span>
          </div>

          <table className="w-full text-left border-2 border-black border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black bg-gray-100 print:bg-transparent text-[10px] font-bold uppercase">
                <th className="py-1.5 px-2.5 w-8 text-center border-r border-black">#</th>
                <th className="py-1.5 px-2.5 border-r border-black">Item Description</th>
                <th className="py-1.5 px-2.5 w-24 text-center border-r border-black">Variant / Pack</th>
                <th className="py-1.5 px-2.5 w-12 text-center border-r border-black">Qty</th>
                <th className="py-1.5 px-2.5 w-20 text-right border-r border-black">Unit Rate</th>
                <th className="py-1.5 px-2.5 w-20 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b-2 border-black">
              {order.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-1.5 px-2.5 text-center border-r border-black font-mono text-[10px]">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-black font-semibold text-black text-[11px]">
                    {item.product?.name || item.productName || "Product"}
                  </td>
                  <td className="py-1.5 px-2.5 text-center border-r border-black text-gray-700 text-[10px]">
                    {item.variantName || "Standard"}
                  </td>
                  <td className="py-1.5 px-2.5 text-center border-r border-black font-bold text-[11px]">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 px-2.5 text-right border-r border-black font-mono text-[11px]">
                    ₹{(item.unitPrice / 100).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-bold font-mono text-[11px]">
                    ₹{(item.subtotal / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-gray-300 bg-pink-50/30 print:bg-transparent">
                <td className="py-1.5 px-2.5 text-center border-r border-black font-mono text-[10px]">
                  🎁
                </td>
                <td className="py-1.5 px-2.5 border-r border-black font-semibold text-black text-[11px]">
                  Surprise Gift (Complimentary Free Treat) 🎁
                </td>
                <td className="py-1.5 px-2.5 text-center border-r border-black text-gray-700 text-[10px]">
                  Free Gift
                </td>
                <td className="py-1.5 px-2.5 text-center border-r border-black font-bold text-[11px]">
                  1
                </td>
                <td className="py-1.5 px-2.5 text-right border-r border-black font-mono text-[11px] line-through text-gray-400 print:text-black">
                  ₹149.00
                </td>
                <td className="py-1.5 px-2.5 text-right font-bold font-mono text-[11px] text-emerald-700 print:text-black">
                  FREE
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bill Summary Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3.5">
          {/* Left: Notes & Declaration */}
          <div className="sm:col-span-6 text-[10px] text-gray-600 flex flex-col justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-black uppercase text-[9px] tracking-wider">
                Fulfillment &amp; Customer Note:
              </p>
              <p className="text-[10px] leading-relaxed">
                Thank you for ordering with Pink Farm! Goods are handpicked &amp; packed hygienically. For any queries, WhatsApp us at {settings?.supportPhone || "+91 8437504040"}.
              </p>
            </div>
            <div className="mt-2 pt-1 border-t border-gray-300 text-[9px]">
              <div>Declaration: Packaged foods for direct consumer consumption.</div>
            </div>
          </div>

          {/* Right: Totals Box */}
          <div className="sm:col-span-6 bg-gray-50 print:bg-transparent border border-black p-2.5 text-xs">
            <div className="space-y-1 font-medium">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Items Subtotal:</span>
                <span className="font-mono">₹{(order.subtotal / 100).toFixed(2)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 print:text-black text-[11px]">
                  <span>Combo / Coupon Discount:</span>
                  <span className="font-mono font-bold">-₹{(order.discount / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Shipping / Delivery Fee:</span>
                <span className="font-mono">
                  {order.deliveryFee === 0 ? "FREE" : `₹${(order.deliveryFee / 100).toFixed(2)}`}
                </span>
              </div>

              <div className="border-t-2 border-black pt-1.5 mt-1 flex justify-between items-baseline font-black text-xs sm:text-sm">
                <span>{order.paymentStatus === "PAID" ? "TOTAL PAID AMOUNT:" : "TOTAL AMOUNT:"}</span>
                <span className="font-mono text-sm sm:text-base">₹{(order.totalAmount / 100).toFixed(2)}</span>
              </div>

              <div className="text-[9px] text-gray-500 pt-0.5 text-right">
                Payment: <span className="font-bold text-black">{order.paymentMethod} · {order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Verification Section */}
        <div className="border-t-2 border-black pt-2.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-600 gap-2">
          <div className="flex gap-6">
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Checked &amp; Packed By:</span>
              <span className="font-mono font-bold text-black">__________________</span>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Dispatch Date:</span>
              <span className="font-mono font-bold text-black">{orderDate}</span>
            </div>
          </div>
          <div className="text-center sm:text-right text-[10px] font-bold text-black">
            ✦ Authentic Premium Goods · Packed With Care ✦
          </div>
        </div>

      </div>
    </div>
  );
}
