/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  Loader2,
  MapPin,
} from "lucide-react";

export default function MemberOrders() {
  const { user } = useUserStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch only PERSONAL orders
      const res = await fetch(`/api/orders?userId=${user.id}&view=MY_ORDERS`);
      if (res.ok) {
        const data = await res.json();

        // 2. AUTO-DELIVERY LOGIC
        // If order is > 30 mins old and still 'PREPARING', show as 'DELIVERED'
        const updatedOrders = data.map((order: any) => {
          const orderTime = new Date(order.createdAt).getTime();
          const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;

          if (order.status === "PREPARING" && orderTime < thirtyMinsAgo) {
            return { ...order, status: "DELIVERED" };
          }
          return order;
        });

        setOrders(updatedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchMyOrders]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

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

      if (res.ok) fetchMyOrders();
    } catch (error) {
      console.error("Cancellation failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
          My Orders
        </h1>
        <p className="text-zinc-500 mt-2">
          Tracking personal orders for{" "}
          <span className="font-bold text-zinc-900 uppercase">
            {/* FIX: If Admin, show Global, otherwise show their country */}
            {user.role === "ADMIN" ? "Global" : user.country}
          </span>{" "}
          Region
        </p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-medium">
            You haven&apos;t placed any orders yet.
          </div>
        ) : (
          orders.map((order) => {
            const isActive =
              order.status === "PENDING" || order.status === "PREPARING";
            const isCancelled = order.status === "CANCELLED";
            const isDelivered = order.status === "DELIVERED";
            const isLoading = loadingAction === order.id;

            // FIX: Get region from the RESTAURANT, not the user.
            // This ensures Admin (USA) sees Rupees when ordering form India.
            const orderRegion = order.restaurant?.region || user.country;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  isActive
                    ? "border-orange-200 shadow-lg shadow-orange-900/5 ring-1 ring-orange-100"
                    : isCancelled
                      ? "border-red-100 bg-red-50/10"
                      : "border-zinc-100 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black uppercase ${
                        isActive
                          ? "bg-orange-100 text-orange-600"
                          : isCancelled
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {order.restaurant?.name.charAt(0) || "?"}
                    </div>
                    <div>
                      {/* FIX: Added Region Badge next to Name */}
                      <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                        {order.restaurant?.name || "Unknown Vendor"}
                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200 flex items-center gap-1">
                          <MapPin className="w-2 h-2" /> {orderRegion}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mt-1">
                        <span>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{order.orderItems.length} Items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        {order.status}
                      </span>
                    ) : isCancelled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Delivered
                      </span>
                    )}
                    {/* FIX: Use orderRegion for correct currency symbol */}
                    <span className="font-black text-zinc-900 text-lg">
                      {formatPrice(order.totalAmount, orderRegion)}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Items
                    </p>
                    <ul className="space-y-1">
                      {order.orderItems.map((item: any) => (
                        <li
                          key={item.id}
                          className="text-sm font-medium text-zinc-700 flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                          {item.menuItem.name} (x{item.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isActive && (
                    <div className="flex flex-col gap-3">
                      <div className="bg-zinc-50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-zinc-900">
                            Estimated Arrival
                          </p>
                          <p className="text-sm text-zinc-500">
                            25 - 30 minutes
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600">
                          <Package className="w-5 h-5" />
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {isLoading ? "Cancelling..." : "Cancel Order"}
                      </button>
                    </div>
                  )}

                  {isDelivered && (
                    <div className="flex items-center justify-end">
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Order Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
