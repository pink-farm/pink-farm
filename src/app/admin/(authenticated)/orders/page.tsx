import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { logServerError } from "@/lib/server-log.mjs";
import { OrdersTable } from "./OrdersTable";

export const instant = false;

export default async function AdminOrdersPage() {
  let orders: Prisma.OrderGetPayload<{ include: { items: true } }>[] = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  } catch (err) {
    logServerError("security.admin_orders.load_failed", err);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your customer orders, fulfillment, and payment statuses.
          </p>
        </div>
        <div className="text-sm font-semibold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200">
          Total Orders: <span className="text-brand-green font-bold">{orders.length}</span>
        </div>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
