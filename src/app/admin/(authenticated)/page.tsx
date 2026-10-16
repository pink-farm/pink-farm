import { prisma } from "@/lib/db";
import { DashboardOverview, SerializedOrder } from "./DashboardOverview";

export const instant = false;

export default async function AdminDashboard() {
  let serializedOrders: SerializedOrder[] = [];
  let lowStockCount = 0;

  try {
    const [orders, products] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        include: { variants: true },
      }),
    ]);

    serializedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      createdAt: o.createdAt.toISOString(),
    }));

    products.forEach((p) => {
      if (p.variants.length > 0) {
        lowStockCount += p.variants.filter((v) => v.stockQuantity <= p.lowStockThreshold).length;
      } else {
        if (p.stockQuantity <= p.lowStockThreshold) lowStockCount++;
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
  }

  return (
    <DashboardOverview
      initialOrders={serializedOrders}
      lowStockCount={lowStockCount}
    />
  );
}
