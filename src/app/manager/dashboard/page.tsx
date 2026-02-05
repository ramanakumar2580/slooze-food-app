"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/store/useUserStore";
import {
  CheckCircle2,
  Clock,
  MapPin,
  ShoppingBag,
  UtensilsCrossed,
  XCircle,
  Loader2,
} from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useUserStore();

  // 1. Live State
  const [stats, setStats] = useState({
    orderCount: 0,
    pendingApprovals: 0,
    revenueUSD: 0,
    revenueINR: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamOrders, setTeamOrders] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // 2. Fetch Regional Data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch Stats (Filtered by Manager's Country)
      const statsRes = await fetch(
        `/api/dashboard?role=MANAGER&country=${user.country}`,
      );
      if (statsRes.ok) setStats(await statsRes.json());

      // Fetch Team Orders (Filtered by Manager's Country)
      const ordersRes = await fetch(
        `/api/orders?view=TEAM_ORDERS&role=MANAGER&country=${user.country}`,
      );

      if (ordersRes.ok) {
        const data = await ordersRes.json();

        // FIX: Filter out orders placed by ADMINs.
        // Managers should only see orders from MEMBER or MANAGER roles.
        const employeeOrders = data.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (order: any) => order.user?.role !== "ADMIN",
        );

        setTeamOrders(employeeOrders);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // 3. HANDLER: Approve Payment
  const handleApprove = async (orderId: string) => {
    setLoadingAction(orderId);
    try {
      const res = await fetch("/api/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          approverId: user?.id,
          approverRole: user?.role,
        }),
      });

      if (res.ok) fetchDashboardData(); // Instantly refresh UI
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. HANDLER: Reject Order
  const handleReject = async (orderId: string) => {
    if (!confirm("Are you sure you want to reject this team order?")) return;
    setLoadingAction(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          paymentStatus: "REJECTED",
        }),
      });

      if (res.ok) fetchDashboardData();
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  // 5. REGION-SPECIFIC HELPERS
  const isIndia = user.country === "INDIA";
  const currencyCode = isIndia ? "INR" : "USD";
  const locale = isIndia ? "en-IN" : "en-US";

  // Select the correct revenue figure from backend stats
  const totalRevenue = isIndia ? stats.revenueINR : stats.revenueUSD;

  // Dynamic Budget Limit: ₹8,30,000 for India vs $10,000 for USA
  const budgetLimit = isIndia ? 830000 : 10000;
  const budgetPercentage = (totalRevenue / budgetLimit) * 100;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Manager Portal
          </h1>
          <div className="flex items-center gap-2 mt-2 text-zinc-500">
            <span>Overview for</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase">
              <MapPin className="w-3 h-3" />
              {user.country} REGION
            </span>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-zinc-200">
          + New Team Order
        </button>
      </div>

      {/* REGIONAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-24 h-24 text-blue-600" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Team Orders</p>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">
            {stats.orderCount}
          </h3>
          <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-1 rounded">
            Processed this month
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24 text-orange-600" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Pending Approval</p>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">
            {stats.pendingApprovals}
          </h3>
          <p className="text-xs font-bold text-orange-600 mt-2 bg-orange-50 inline-block px-2 py-1 rounded">
            {stats.pendingApprovals > 0 ? "Action required" : "All clear"}
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UtensilsCrossed className="w-24 h-24 text-green-600" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Regional Spend</p>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">
            {formatMoney(totalRevenue)}
          </h3>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${
                budgetPercentage > 85 ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">
            {budgetPercentage.toFixed(1)}% of {formatMoney(budgetLimit)} limit
          </p>
        </div>
      </div>

      {/* TEAM ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="font-bold text-zinc-900 text-lg">
            Team Activity ({user.country})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {teamOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-zinc-400"
                  >
                    No orders have been placed by the {user.country} team yet.
                  </td>
                </tr>
              ) : (
                teamOrders.map((order) => {
                  const isPending =
                    order.paymentStatus === "PENDING" &&
                    order.status !== "CANCELLED";
                  const isLoading = loadingAction === order.id;

                  // Summarize items for the table
                  const itemSummary = order.orderItems
                    .map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (item: any) => `${item.menuItem.name} x${item.quantity}`,
                    )
                    .join(", ");

                  return (
                    <tr
                      key={order.id}
                      className="group hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900">
                          {order.user?.name}
                        </span>
                        <span className="text-xs text-zinc-400 block">
                          {order.restaurant?.name}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-zinc-500 max-w-[200px] truncate"
                        title={itemSummary}
                      >
                        {itemSummary}
                      </td>
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : order.status === "CANCELLED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatMoney(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(order.id)}
                              disabled={isLoading}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(order.id)}
                              disabled={isLoading}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs font-medium">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
