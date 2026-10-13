import { prisma } from "@/lib/db";
import { ShoppingBag, ArrowUpRight, Clock, CheckCircle, Printer } from "lucide-react";
import Link from "next/link";
import { FulfillmentStatusSelect } from "./FulfillmentStatusSelect";

export const instant = false;

export default async function AdminOrdersPage() {
  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  } catch (err) {
    console.warn("Could not query orders:", err);
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 bg-gray-50/50">
                <th className="py-4 px-6 font-semibold">Order ID</th>
                <th className="py-4 px-6 font-semibold">Customer</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Payment</th>
                <th className="py-4 px-6 font-semibold">Fulfillment</th>
                <th className="py-4 px-6 font-semibold text-right">Amount</th>
                <th className="py-4 px-6 font-semibold text-center">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-6 font-bold text-brand-green">{order.orderNumber}</td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-800">{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.customerPhone}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.paymentStatus === "PAID" ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <FulfillmentStatusSelect 
                      orderId={order.id} 
                      initialStatus={order.fulfillmentStatus} 
                    />
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">
                    ₹{(order.totalAmount / 100).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Link
                      href={`/admin/orders/${order.id}/slip`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm"
                      title="Print Dispatch Receipt / Packaging Slip"
                    >
                      <Printer size={13} />
                      <span>Print Slip</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ShoppingBag size={36} className="mx-auto mb-2 text-gray-300" />
                    No orders placed yet. New store orders will appear here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
