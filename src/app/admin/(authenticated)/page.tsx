import { prisma } from "@/lib/db";
import { Package, ShoppingBag, Banknote, Clock, Printer } from "lucide-react";
import Link from "next/link";

export const instant = false;

export default async function AdminDashboard() {
  let stats = { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, lowStockProducts: 0 };
  let recentOrders: any[] = [];

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const products = await prisma.product.findMany({
      include: { variants: true },
    });

    stats.totalOrders = orders.length;
    stats.totalRevenue = orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((acc, o) => acc + o.totalAmount, 0);
    stats.pendingOrders = orders.filter((o) => o.fulfillmentStatus === "PENDING" && o.paymentStatus === "PAID").length;

    let lowStockCount = 0;
    products.forEach((p) => {
      if (p.variants.length > 0) {
        lowStockCount += p.variants.filter((v) => v.stockQuantity <= p.lowStockThreshold).length;
      } else {
        if (p.stockQuantity <= p.lowStockThreshold) lowStockCount++;
      }
    });
    stats.lowStockProducts = lowStockCount;
    recentOrders = orders;
  } catch (error) {
    console.error("Dashboard error:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Here is what's happening in your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 text-green-600 p-4 rounded-xl">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue / 100).toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-orange-100 text-orange-600 p-4 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Action</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-red-100 text-red-600 p-4 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Order Number</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Payment</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium text-center">Slip</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 font-medium text-brand-green">{order.orderNumber}</td>
                  <td className="py-4">{order.customerName}</td>
                  <td className="py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4">
                     <span className="text-sm text-gray-700">{order.fulfillmentStatus}</span>
                  </td>
                  <td className="py-4 text-right font-medium">₹{(order.totalAmount / 100).toFixed(2)}</td>
                  <td className="py-4 text-center">
                    <Link
                      href={`/admin/orders/${order.id}/slip`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm"
                      title="Print Dispatch Receipt / Packaging Slip"
                    >
                      <Printer size={12} />
                      <span>Slip</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
