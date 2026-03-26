/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Loader2,
  Users,
} from "lucide-react";

export default function ManagerOrders() {
  const { user } = useUserStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      let employeeOrders: any[] = [];
      const ordersRes = await fetch(
        `/api/orders?view=TEAM_ORDERS&role=MANAGER&country=${user.country}`,
        { cache: "no-store" },
      );
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        employeeOrders = data.filter(
          (order: any) => order.user?.role !== "ADMIN",
        );
      }

      let groupsData: any[] = [];
      const groupsRes = await fetch(`/api/groups?region=${user.country}`, {
        cache: "no-store",
      });
      if (groupsRes.ok) {
        groupsData = await groupsRes.json();
      }

      const enrichedEmployeeOrders = employeeOrders.map((order) => {
        if (order.isGroupOrder && order.groupOrderId) {
          const foundGroup = groupsData.find(
            (g) => g.id === order.groupOrderId,
          );
          if (foundGroup) {
            return {
              ...order,
              groupName: foundGroup.name,
              membersList: foundGroup.members
                ?.map((m: any) => m.name)
                .join(", "),
            };
          }
        }
        return order;
      });

      const groupOrdersMap: any[] = [];

      groupsData.forEach((g: any) => {
        if (!g.items || g.items.length === 0) return;

        const sessionMap: Record<string, any[]> = {};
        g.items.forEach((item: any) => {
          const rId = item.menuItem?.restaurantId || "unknown";

          const timeKey = item.addedAt
            ? new Date(item.addedAt).toISOString().substring(0, 16)
            : item.id;
          const sessionKey = `${item.userId}-${rId}-${timeKey}`;

          if (!sessionMap[sessionKey]) sessionMap[sessionKey] = [];
          sessionMap[sessionKey].push(item);
        });

        const membersList =
          g.members?.map((m: any) => m.name).join(", ") || "Unknown";

        Object.entries(sessionMap).forEach(([sessionKey, itemsArr]) => {
          const sUserId = itemsArr[0].userId;
          const sRestaurantId = itemsArr[0].menuItem?.restaurantId;
          const restaurantName =
            itemsArr[0].menuItem?.restaurant?.name || "Unknown Vendor";
          const itemIds = itemsArr.map((i: any) => i.id);

          const total = itemsArr.reduce(
            (sum, i) => sum + (i.menuItem?.price || 0) * i.quantity,
            0,
          );
          const sessionUser = itemsArr[0].user || { name: "Squad Member" };

          groupOrdersMap.push({
            id: g.id,
            groupName: g.name,
            membersList: membersList,
            sessionId: `${g.id}-${sessionKey}`,
            sessionUserId: sUserId,
            sessionRestaurantId: sRestaurantId,
            itemIds: itemIds,
            isGroupOrder: true,
            user: { name: sessionUser.name },
            restaurant: { name: restaurantName },
            orderItems: itemsArr,
            status:
              g.status === "OPEN" || g.status === "SUBMITTED"
                ? "PENDING"
                : g.status,
            paymentStatus:
              g.status === "OPEN" || g.status === "SUBMITTED"
                ? "PENDING"
                : g.status === "APPROVED"
                  ? "PAID"
                  : "REJECTED",
            totalAmount: total,
            createdAt: itemsArr[0].addedAt || g.createdAt,
          });
        });
      });

      // Sort: Keep Pending at the top, then sort by newest date
      const combinedOrders = [
        ...enrichedEmployeeOrders,
        ...groupOrdersMap,
      ].sort((a, b) => {
        const aIsPending =
          a.paymentStatus === "PENDING" && a.status !== "CANCELLED";
        const bIsPending =
          b.paymentStatus === "PENDING" && b.status !== "CANCELLED";

        if (aIsPending && !bIsPending) return -1;
        if (!aIsPending && bIsPending) return 1;

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setOrders(combinedOrders);
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
    orderId: string,
    isGroupOrder?: boolean,
    sessionId?: string,
    sessionUserId?: string,
    sessionRestaurantId?: string,
    itemIds?: string[],
  ) => {
    if (!confirm("Approve order and charge to Corporate Card?")) return;

    setLoadingAction(sessionId || orderId);

    try {
      if (isGroupOrder && sessionUserId) {
        const res = await fetch(`/api/groups/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "APPROVED",
            approveUserId: sessionUserId,
            restaurantId: sessionRestaurantId,
            itemIds: itemIds,
          }),
        });
        if (res.ok) fetchOrders();
      } else {
        const res = await fetch("/api/orders/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            approverId: user?.id,
            approverRole: user?.role,
          }),
        });
        if (res.ok) fetchOrders();
      }
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (
    orderId: string,
    isGroupOrder?: boolean,
    sessionId?: string,
    sessionUserId?: string,
    sessionRestaurantId?: string,
    itemIds?: string[],
  ) => {
    if (!confirm("Are you sure you want to reject this team order?")) return;

    setLoadingAction(sessionId || orderId);
    try {
      if (isGroupOrder && sessionUserId) {
        const res = await fetch(`/api/groups/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            rejectUserId: sessionUserId,
            restaurantId: sessionRestaurantId,
            itemIds: itemIds,
          }),
        });
        if (res.ok) fetchOrders();
      } else {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            paymentStatus: "REJECTED",
          }),
        });
        if (res.ok) fetchOrders();
      }
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
        <div className="overflow-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-zinc-50 border-b border-zinc-100 sticky top-0 z-10 shadow-sm outline outline-1 outline-zinc-100">
              <tr>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs bg-zinc-50">
                  Employee
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs bg-zinc-50">
                  Order Details
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs bg-zinc-50">
                  Time
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs bg-zinc-50">
                  Total
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs bg-zinc-50">
                  Status
                </th>
                <th className="px-8 py-5 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right bg-zinc-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {orders.map((order) => {
                const isPending =
                  order.paymentStatus === "PENDING" &&
                  order.status !== "CANCELLED";
                const isLoading =
                  loadingAction === (order.sessionId || order.id);

                const aggregatedItems = order.orderItems.reduce(
                  (acc: any[], curr: any) => {
                    const existing = acc.find(
                      (i: any) => i.menuItemId === curr.menuItemId,
                    );
                    if (existing) {
                      existing.quantity += curr.quantity;
                    } else {
                      acc.push({ ...curr });
                    }
                    return acc;
                  },
                  [],
                );

                const itemSummary = aggregatedItems
                  .map(
                    (item: any) =>
                      `${item.menuItem?.name || "Item"} x${item.quantity}`,
                  )
                  .join(", ");

                return (
                  <tr
                    key={order.sessionId || order.id}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-xs uppercase">
                          {order.user?.name.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900">
                              {order.user?.name || "Unknown"}
                            </span>
                            {order.isGroupOrder && (
                              <span
                                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-blue-100 truncate"
                                title={`Group: ${order.groupName || order.groupOrder?.name || "Group Order"}`}
                              >
                                <Users className="w-3 h-3 flex-shrink-0" />
                                {order.groupName ||
                                  order.groupOrder?.name ||
                                  "GROUP"}
                              </span>
                            )}
                          </div>
                          {order.isGroupOrder && (
                            <div
                              className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate"
                              title={`Members: ${order.membersList || "Unknown"}`}
                            >
                              Members: {order.membersList || "Unknown"}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6 font-medium text-zinc-600 max-w-[250px] leading-relaxed align-top">
                      {itemSummary}
                    </td>

                    <td className="px-8 py-6 text-zinc-500 font-mono text-xs align-top whitespace-nowrap">
                      <div className="font-bold text-zinc-700">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-8 py-6 font-bold text-zinc-900 align-top">
                      {formatPrice(order.totalAmount, user.country)}
                    </td>

                    <td className="px-8 py-6 align-top">
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

                    <td className="px-8 py-6 text-right align-top">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              handleApproveAndPay(
                                order.groupOrderId || order.id,
                                order.isGroupOrder,
                                order.sessionId,
                                order.sessionUserId,
                                order.sessionRestaurantId,
                                order.itemIds,
                              )
                            }
                            disabled={isLoading}
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 transition-all disabled:opacity-50"
                            title="Approve Order"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleReject(
                                order.groupOrderId || order.id,
                                order.isGroupOrder,
                                order.sessionId,
                                order.sessionUserId,
                                order.sessionRestaurantId,
                                order.itemIds,
                              )
                            }
                            disabled={isLoading}
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                            title="Reject Order"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-5 h-5" />
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
