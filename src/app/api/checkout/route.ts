import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";
import Razorpay from "razorpay";
import { calculateCouponDiscount, getCouponFailure } from "@/lib/coupons";
import { comboQuantityQualifies, getComboDiscountPercent, isSameOriginMutation, isValidCheckoutQuantity, readBoundedJson } from "@/lib/request-security.mjs";
import { createCheckoutCancelToken } from "@/lib/payment-token";
import { classifyRazorpayOrderError, getRazorpayErrorDiagnostics } from "@/lib/razorpay-errors.mjs";

type CheckoutItem = { id: string; slug?: string; variantId?: string; variantName?: string; name?: string; quantity: number };
type CheckoutCustomerDetails = { fullName?: string; mobile?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; pinCode?: string; deliveryInstructions?: string; couponCode?: string };
type StoreProduct = { id: string; name: string; slug: string; imageUrl: string; isAvailable: boolean; basePrice: number; originalPrice: number | null; stockQuantity: number; variants: { id: string; name?: string; packSize?: string; isAvailable: boolean; price: number; stockQuantity: number }[] };

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const parsed = await readBoundedJson(request, 10_000_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Order details must be a JSON object." }, { status: 400 });
    const body = parsed.value;
    const { customerDetails, items, couponCode } = body as {
      customerDetails?: CheckoutCustomerDetails; 
      items?: CheckoutItem[]; 
      couponCode?: string;
    };

    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return NextResponse.json({ error: "Your shopping cart is empty." }, { status: 400 });
    }
    let comboTiers = [
      { count: 3, discount: 11 },
      { count: 5, discount: 15 },
    ];
    try {
      const settings = await prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: { comboTier1Count: true, comboTier1Discount: true, comboTier2Count: true, comboTier2Discount: true },
      });
      if (settings) {
        comboTiers = [
          { count: settings.comboTier1Count, discount: settings.comboTier1Discount },
          { count: settings.comboTier2Count, discount: settings.comboTier2Discount },
        ].filter((tier) => Number.isInteger(tier.count) && tier.count >= 1 && tier.count <= 30 && Number.isInteger(tier.discount) && tier.discount >= 1 && tier.discount <= 95);
      }
    } catch {
      // Continue with safe default combo tiers if settings cannot be read
    }
    const allowedComboDiscounts = [...new Set(comboTiers.map((tier) => tier.discount))];
    const comboTotals = new Map<number, { quantity: number; requiredQuantity: number }>();
    for (const item of items) {
      const combo = getComboDiscountPercent(item?.variantName, allowedComboDiscounts);
      if (combo !== null && isValidCheckoutQuantity(item.quantity)) {
        const requiredQuantity = Math.max(...comboTiers.filter((tier) => tier.discount === combo).map((tier) => tier.count));
        const current = comboTotals.get(combo);
        comboTotals.set(combo, { quantity: (current?.quantity || 0) + item.quantity, requiredQuantity });
      }
    }
    if ([...comboTotals].some(([discount, totals]) => !comboQuantityQualifies(discount, totals.quantity, totals.requiredQuantity))) {
      return NextResponse.json({ error: "Add the required number of items to qualify for this combo price." }, { status: 400 });
    }

    const rawDetails = customerDetails || {};
    const rawMobile = String(rawDetails.mobile || "").replace(/[^\d]/g, "");
    const fullName = typeof rawDetails.fullName === "string" ? rawDetails.fullName.trim() : "";
    const addressLine1 = typeof rawDetails.addressLine1 === "string" ? rawDetails.addressLine1.trim() : "";
    const city = typeof rawDetails.city === "string" ? rawDetails.city.trim() : "";
    const state = typeof rawDetails.state === "string" ? rawDetails.state.trim() : "";
    const pinCode = typeof rawDetails.pinCode === "string" ? rawDetails.pinCode.trim() : "";
    if (fullName.length < 2 || fullName.length > 100 || rawMobile.length !== 10 || !/^[6-9]\d{9}$/.test(rawMobile) || addressLine1.length < 5 || addressLine1.length > 200 || city.length < 2 || city.length > 100 || state.length < 2 || state.length > 100 || !/^[1-9]\d{5}$/.test(pinCode)) {
      return NextResponse.json({ error: "Enter valid delivery details before placing your order." }, { status: 400 });
    }
    const cleanCustomerDetails = {
      fullName,
      mobile: rawMobile,
      addressLine1,
      addressLine2: typeof rawDetails.addressLine2 === "string" ? rawDetails.addressLine2.trim().slice(0, 200) : "",
      city,
      state,
      pinCode,
      deliveryInstructions: typeof rawDetails.deliveryInstructions === "string" ? rawDetails.deliveryInstructions.trim().slice(0, 500) : "",
    };

    // Server-side validation of pricing and inventory
    let subtotal = 0;
    const validatedItems: { productId: string; productName: string; productSlug: string; productImageUrl: string | null; variantId: string | null; variantName: string | null; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id || !isValidCheckoutQuantity(item.quantity)) {
        return NextResponse.json({ error: "Your cart contains an invalid item or quantity." }, { status: 400 });
      }

      let product: StoreProduct | null = null;
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(item.id);

      if (isValidObjectId) {
        try {
          product = await prisma.product.findUnique({ where: { id: item.id }, include: { variants: true } });
        } catch {
          return NextResponse.json({ error: "We couldn't verify current product availability. Please try again shortly." }, { status: 503 });
        }
      }

      // Cart contents persist in the browser. Older carts can hold fallback or
      // deleted product IDs, so resolve the current database record by its stable
      // slug before declaring an item unavailable.
      if (!product && typeof item.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
        try {
          product = await prisma.product.findUnique({ where: { slug: item.slug }, include: { variants: true } });
        } catch {
          return NextResponse.json({ error: "We couldn't verify current product availability. Please try again shortly." }, { status: 503 });
        }
      }

      if (!product) {
        return NextResponse.json({ error: `Product "${item.name || "Item"}" is currently unavailable.` }, { status: 400 });
      }
      if (!product.isAvailable) return NextResponse.json({ error: "This product is currently unavailable." }, { status: 409 });

      let price = product.basePrice;
      let matchedVariantId: string | null = null;

      const combo = getComboDiscountPercent(item.variantName, allowedComboDiscounts);
      if (combo !== null && item.variantId) return NextResponse.json({ error: "A combo item has an invalid product option." }, { status: 400 });
      if (combo === null && (item.variantId || item.variantName)) {
        const variant = product.variants?.find((v) => item.variantId && v.id === item.variantId) ??
          product.variants?.find((v) => item.variantName && (v.name === item.variantName || v.packSize === item.variantName));
        if (!variant) return NextResponse.json({ error: "A selected product option is unavailable." }, { status: 400 });
        if (!variant.isAvailable) return NextResponse.json({ error: "This product option is currently unavailable." }, { status: 409 });
        if (variant) {
          matchedVariantId = /^[0-9a-fA-F]{24}$/.test(variant.id) ? variant.id : null;
          price = variant.price;
        }
      }

      if (combo !== null) {
        const stockVariant = product.variants?.[0];
        if (stockVariant && !stockVariant.isAvailable) return NextResponse.json({ error: "This product option is currently unavailable." }, { status: 409 });
        if (stockVariant) matchedVariantId = stockVariant.id;
        const mrp = product.originalPrice && product.originalPrice > product.basePrice ? product.originalPrice : product.basePrice;
        price = Math.round(mrp * (1 - combo / 100));
      }

      const quantity = item.quantity;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImageUrl: product.imageUrl.startsWith("data:") ? null : product.imageUrl,
        variantId: matchedVariantId,
        variantName: item.variantName || null,
        quantity,
        unitPrice: price,
        subtotal: itemSubtotal,
      });
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: "No valid items found in cart." }, { status: 400 });
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
    } catch {
      // Continue with standard default delivery fees if settings cannot be read
    }

    const finalDeliveryFee = subtotal > 0 ? (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : deliveryFee) : 0;
    
    // Validate coupon against server-calculated subtotal and customer identity.
    let discount = 0;
    const rawCoupon = couponCode || rawDetails.couponCode;
    const customerSession = await getCustomerSession();
    const customerId = (customerSession?.userId && /^[0-9a-fA-F]{24}$/.test(String(customerSession.userId)))
      ? String(customerSession.userId)
      : undefined;
    const normalizedCoupon = rawCoupon ? String(rawCoupon).trim().toUpperCase() : "";
    let coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>> = null;
    if (normalizedCoupon) {
      coupon = await prisma.coupon.findUnique({ where: { code: normalizedCoupon } });
      if (!coupon) return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
      const failure = await getCouponFailure({ coupon, subtotal, phone: cleanCustomerDetails.mobile, customerId });
      if (failure) return NextResponse.json({ error: failure }, { status: 400 });
      discount = calculateCouponDiscount(coupon, subtotal);
    }
    const totalAmount = Math.round(Math.max(0, subtotal - discount + finalDeliveryFee));
    if (totalAmount < 100) {
      return NextResponse.json({ error: "The order total must be at least ₹1 for online payment." }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim().replace(/^["']|["']$/g, "");
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["']|["']$/g, "");
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Online payments are not configured yet. Please contact the store." }, { status: 503 });
    }

    // Generate the gateway order using the server-calculated total.
    const orderNumber = `PF-${new Date().getFullYear()}-${randomUUID().replace(/-/g, "").toUpperCase()}`;
    const selectedMethod = "RAZORPAY";
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let gatewayOrderId: string;
    try {
      const gatewayOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: orderNumber.slice(0, 40),
        notes: { orderNumber },
      });
      gatewayOrderId = gatewayOrder.id;
    } catch (error) {
      const diagnostics = getRazorpayErrorDiagnostics(error);
      const diagnosticError = new Error("Razorpay order creation failed");
      Object.assign(diagnosticError, diagnostics);
      logServerError("security.checkout.razorpay_order_failed", diagnosticError);
      const failure = classifyRazorpayOrderError(error);
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    // Create Order in DB
    const order = await prisma.$transaction(async (tx) => {
      if (coupon) {
        if (coupon.firstOrderOnly || coupon.perCustomerLimit !== null) {
          const identityWhere = customerId
            ? { OR: [{ customerId }, { customerPhone: cleanCustomerDetails.mobile }] }
            : { customerPhone: cleanCustomerDetails.mobile };
          if (coupon.firstOrderOnly) {
            const previousOrder = await tx.order.findFirst({
              where: { ...identityWhere, fulfillmentStatus: { not: "CANCELLED" } },
              select: { id: true },
            });
            if (previousOrder) throw new Error("COUPON_NOT_ELIGIBLE");
          }
          if (coupon.perCustomerLimit !== null) {
            const priorUses = await tx.order.count({
              where: { ...identityWhere, couponCode: coupon.code, fulfillmentStatus: { not: "CANCELLED" } },
            });
            if (priorUses >= coupon.perCustomerLimit) throw new Error("COUPON_NOT_ELIGIBLE");
          }
        }
        const claimed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            isActive: true,
            startsAt: { lte: new Date() },
            ...(coupon.expiresAt ? { expiresAt: { gt: new Date() } } : {}),
            ...(coupon.usageLimit !== null ? { usedCount: { lt: coupon.usageLimit } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count !== 1) throw new Error("COUPON_UNAVAILABLE");
      }
      // Reserve stock atomically when the order is created. Cancellation returns it.
      for (const item of validatedItems) {
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
              where: { id: item.variantId, productId: item.productId, stockQuantity: { gte: item.quantity } },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          if (updated.count !== 1) throw new Error("INSUFFICIENT_STOCK");
        } else {
          const updated = await tx.product.updateMany({
              where: { id: item.productId, stockQuantity: { gte: item.quantity } },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          if (updated.count !== 1) throw new Error("INSUFFICIENT_STOCK");
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          customerName: cleanCustomerDetails.fullName.slice(0, 100),
          customerPhone: cleanCustomerDetails.mobile,
          customerId,
          addressLine1: cleanCustomerDetails.addressLine1.slice(0, 200),
          addressLine2: cleanCustomerDetails.addressLine2 ? cleanCustomerDetails.addressLine2.slice(0, 200) : undefined,
          city: cleanCustomerDetails.city.slice(0, 100),
          state: cleanCustomerDetails.state.slice(0, 100),
          pinCode: cleanCustomerDetails.pinCode,
          deliveryInstructions: cleanCustomerDetails.deliveryInstructions ? cleanCustomerDetails.deliveryInstructions.slice(0, 500) : undefined,
          subtotal,
          deliveryFee: finalDeliveryFee,
          discount,
          couponCode: coupon?.code,
          totalAmount,
          paymentStatus: "PENDING",
          paymentMethod: selectedMethod,
          gatewayOrderId,
          fulfillmentStatus: "PENDING",
          items: {
            create: validatedItems.map((vi) => ({
              productId: vi.productId,
              productName: vi.productName,
              productSlug: vi.productSlug,
              productImageUrl: vi.productImageUrl,
              variantId: vi.variantId,
              variantName: vi.variantName,
              quantity: vi.quantity,
              unitPrice: vi.unitPrice,
              subtotal: vi.subtotal,
            })),
          },
        },
      });
    });

    return NextResponse.json({ 
      orderCreated: true,
      orderNumber, 
      orderId: order.id, 
      paymentMethod: selectedMethod,
      paymentStatus: order.paymentStatus,
      amount: totalAmount,
      currency: "INR",
      razorpayOrderId: gatewayOrderId,
      razorpayKeyId: keyId,
      cancelToken: createCheckoutCancelToken(order.id, gatewayOrderId),
    }, { status: 201 });

  } catch (error: unknown) {
    logServerError("security.checkout.failed", error);
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "One or more items no longer have enough stock. Please update your cart and try again." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "COUPON_UNAVAILABLE") {
      return NextResponse.json({ error: "This coupon has just reached its usage limit. Please remove it and try again." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "COUPON_NOT_ELIGIBLE") {
      return NextResponse.json({ error: "This coupon is no longer eligible for your order." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to process order. Please try again." }, { status: 500 });
  }
}
