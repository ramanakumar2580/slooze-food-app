"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Send,
  Loader2,
} from "lucide-react";

export default function ManagerOrders() {
  const { user } = useUserStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `/api/orders?view=TEAM_ORDERS&role=MANAGER&country=${user.country}`,
      );
      if (res.ok) {
        const data = await res.json();

        const employeeOrders = data.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (order: any) => order.user?.role !== "ADMIN",
        );

        setOrders(employeeOrders);
      }
    } catch (error) {
      console.error("Failed to fetch team orders:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleApproveAndPay = async (
    id: string,
    employeeName: string,
    price: number,
  ) => {
    if (
      !confirm(
        `Approve order for ${employeeName} and charge ${formatPrice(
          price,
          user?.country || "USA",
        )} to Corporate Card?`,
      )
    )
      return;

    setLoadingAction(id);

    try {
      const res = await fetch("/api/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          approverId: user?.id,
          approverRole: user?.role,
        }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this team order?")) return;

    setLoadingAction(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          paymentStatus: "REJECTED",
        }),
      });

      if (res.ok) fetchOrders();
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Team Orders
          </h1>
          <p className="text-zinc-500 mt-2">
            Review and approve lunch requests for the{" "}
            <span className="font-bold text-zinc-900 uppercase">
              {user.country}
            </span>{" "}
            Team.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 text-white px-4 py-2 rounded-xl shadow-lg">
          <CreditCard className="w-5 h-5 text-zinc-400" />
          <div className="text-left">
            <p className="text-xs font-bold leading-none">Corporate Card</p>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              **** 4242
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                  Employee
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                  Order Details
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                  Time
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                  Total
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                  Status
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {orders.map((order) => {
                const isPending =
                  order.paymentStatus === "PENDING" &&
                  order.status !== "CANCELLED";
                const isLoading = loadingAction === order.id;

                const itemSummary = order.orderItems
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((item: any) => `${item.menuItem.name} x${item.quantity}`)
                  .join(", ");

                return (
                  <tr
                    key={order.id}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-xs uppercase">
                          {order.user?.name.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-zinc-900">
                          {order.user?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-8 py-6 font-medium text-zinc-600 max-w-[200px] truncate"
                      title={itemSummary}
                    >
                      {itemSummary}
                    </td>
                    <td className="px-8 py-6 text-zinc-500 font-mono text-xs">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-8 py-6 font-bold text-zinc-900">
                      {formatPrice(order.totalAmount, user.country)}
                    </td>
                    <td className="px-8 py-6">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                          <Clock className="w-3 h-3" /> Waiting for Approval
                        </span>
                      ) : order.status === "CANCELLED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                          <CheckCircle2 className="w-3 h-3" /> Paid & Approved
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              handleApproveAndPay(
                                order.id,
                                order.user?.name,
                                order.totalAmount,
                              )
                            }
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white font-bold text-xs rounded-lg hover:bg-orange-600 transition-all shadow-md disabled:opacity-50"
                            title="Approve & Pay"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            {isLoading ? "Processing..." : "Pay Now"}
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={isLoading}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm disabled:opacity-50"
                            title="Reject Order"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="p-12 text-center text-zinc-400 font-medium">
              No live orders have been placed by the {user.country} team yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
