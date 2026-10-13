import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";

type CheckoutItem = { id: string; variantId?: string; variantName?: string; name?: string; quantity: number };
type CheckoutCustomerDetails = { fullName: string; mobile: string; addressLine1: string; addressLine2?: string; city: string; state: string; pinCode: string; deliveryInstructions?: string; couponCode?: string };
type StoreProduct = { id: string; isAvailable: boolean; basePrice: number; originalPrice: number | null; stockQuantity: number; variants: { id: string; isAvailable: boolean; price: number; stockQuantity: number }[] };

export async function POST(request: Request) {
  try {
    const { customerDetails, items, couponCode } = await request.json() as { customerDetails: CheckoutCustomerDetails; items: CheckoutItem[]; couponCode?: string };

    if (!customerDetails || typeof customerDetails.fullName !== "string" || !customerDetails.fullName.trim() || typeof customerDetails.mobile !== "string" || !/^\+?[\d\s-]{10,16}$/.test(customerDetails.mobile) || typeof customerDetails.addressLine1 !== "string" || !customerDetails.addressLine1.trim() || typeof customerDetails.city !== "string" || !customerDetails.city.trim() || typeof customerDetails.state !== "string" || !customerDetails.state.trim() || typeof customerDetails.pinCode !== "string" || !/^[1-9]\d{5}$/.test(customerDetails.pinCode) || !Array.isArray(items) || items.length === 0 || items.length > 50 || !items.every((item) => item && typeof item.id === "string" && Number.isInteger(item.quantity))) {
      return NextResponse.json({ error: "Enter valid delivery details and check your cart." }, { status: 400 });
    }

    // Server-side validation of pricing and inventory
    let subtotal = 0;
    const validatedItems: { productId: string; variantId: string | null; variantName: string | null; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const item of items) {
      let product: StoreProduct | null = null;
      product = await prisma.product.findUnique({ where: { id: item.id }, include: { variants: true } });

      if (!product || !product.isAvailable) {
        return NextResponse.json({ error: `Product ${item.name} is unavailable.` }, { status: 400 });
      }

      let price = product.basePrice;
      let stock = product.stockQuantity;

      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (!variant || !variant.isAvailable) {
          return NextResponse.json({ error: `Variant for ${item.name} is unavailable.` }, { status: 400 });
        }
        price = variant.price;
        stock = variant.stockQuantity;
      }

      // If item was added as part of a Combo discount, calculate discount on originalPrice (MRP)
      if (item.variantName && item.variantName.includes("Combo")) {
        const mrp = (product.originalPrice && product.originalPrice > product.basePrice)
          ? product.originalPrice
          : product.basePrice;
        if (item.variantName.includes("11%")) {
          price = Math.round(mrp * 0.89);
        } else if (item.variantName.includes("15%")) {
          price = Math.round(mrp * 0.85);
        }
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > stock) {
        return NextResponse.json({ error: `Not enough stock for ${item.name}.` }, { status: 400 });
      }

      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        quantity: item.quantity,
        unitPrice: price,
        subtotal: itemSubtotal,
      });
    }

    // Verify store settings and order acceptance
    let deliveryFee = 5000;
    let freeThreshold = 50000;
    try {
      const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
      if (settings) {
        if (!settings.isAcceptingOrders) {
          return NextResponse.json(
            { error: "Online orders are currently paused by the store admin. Please try again later." },
            { status: 400 }
          );
        }
        deliveryFee = settings.deliveryFee;
        freeThreshold = settings.freeDeliveryThreshold ?? 50000;
      }
    } catch (settingsErr) {
      console.warn("Could not load settings in checkout route:", settingsErr);
    }

    const finalDeliveryFee = subtotal > 0 ? (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : deliveryFee) : 0;
    
    // Validate coupon
    let discount = 0;
    const rawCoupon = couponCode || customerDetails.couponCode;
    
    if (rawCoupon && (String(rawCoupon).toUpperCase() === "FLAT499" || String(rawCoupon).toUpperCase() === "FIRST499")) {
      const codeName = String(rawCoupon).toUpperCase();
      if (subtotal >= 199900) {
        // One-time use validation per phone number
        const priorOrder = await prisma.order.findFirst({
          where: {
            customerPhone: customerDetails.mobile,
            discount: { gt: 0 },
          },
        });
        if (priorOrder) {
          return NextResponse.json(
            { error: `Coupon ${codeName} is a one-time use coupon and has already been used for this mobile number.` },
            { status: 400 }
          );
        }
        discount = 49900; // ₹499 in paise
      } else {
        return NextResponse.json(
          { error: `Minimum order of ₹1999 required to use coupon ${codeName}.` },
          { status: 400 }
        );
      }
    }

    const totalAmount = Math.max(0, subtotal - discount + finalDeliveryFee);

    // Generate Order Number
    const orderNumber = `PF-${new Date().getFullYear()}-${randomUUID().replace(/-/g, "").toUpperCase()}`;

    // Create Order in DB
    const customerSession = await getCustomerSession();
    const order = await prisma.$transaction(async (tx) => {
      for (const item of validatedItems) {
        const result = item.variantId
          ? await tx.productVariant.updateMany({ where: { id: item.variantId, productId: item.productId, isAvailable: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } })
          : await tx.product.updateMany({ where: { id: item.productId, isAvailable: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
        if (result.count !== 1) throw new Error("STOCK_CHANGED");
      }
      return tx.order.create({ data: {
        orderNumber,
        customerName: customerDetails.fullName.trim().slice(0, 100),
        customerPhone: customerDetails.mobile.trim(),
        customerId: customerSession ? String(customerSession.userId) : undefined,
        addressLine1: customerDetails.addressLine1.trim().slice(0, 200),
        addressLine2: customerDetails.addressLine2?.trim().slice(0, 200),
        city: customerDetails.city.trim().slice(0, 100),
        state: customerDetails.state.trim().slice(0, 100),
        pinCode: customerDetails.pinCode,
        deliveryInstructions: customerDetails.deliveryInstructions?.trim().slice(0, 500),
        subtotal,
        deliveryFee: finalDeliveryFee,
        discount,
        totalAmount,
        paymentStatus: "PENDING",
        paymentMethod: "COD",
        fulfillmentStatus: "PROCESSING",
        items: { create: validatedItems },
      } });
    });

    return NextResponse.json({ orderCreated: true, orderNumber, orderId: order.id, paymentMethod: "COD" }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") {
      return NextResponse.json({ error: "Stock changed while you were checking out. Please review your cart." }, { status: 409 });
    }
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
