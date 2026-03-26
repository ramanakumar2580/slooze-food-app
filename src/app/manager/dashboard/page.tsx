/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  MapPin,
  ShoppingBag,
  UtensilsCrossed,
  XCircle,
  Loader2,
  Users,
  Bell,
  Check,
  X,
} from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useUserStore();
  const router = useRouter();

  const [stats, setStats] = useState({
    orderCount: 0,
    pendingApprovals: 0,
    revenueUSD: 0,
    revenueINR: 0,
  });
  const [teamOrders, setTeamOrders] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [invites, setInvites] = useState<any[]>([]);

  const [processingInvite, setProcessingInvite] = useState<{
    groupId: string;
    action: "ACCEPT" | "REJECT";
  } | null>(null);

  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const statsRes = await fetch(
        `/api/dashboard?role=MANAGER&country=${user.country}`,
        { cache: "no-store" },
      );
      let fetchedStats = {
        orderCount: 0,
        pendingApprovals: 0,
        revenueUSD: 0,
        revenueINR: 0,
      };
      if (statsRes.ok) fetchedStats = await statsRes.json();

      const invitesRes = await fetch(`/api/groups/invite?userId=${user.id}`);
      if (invitesRes.ok) {
        setInvites(await invitesRes.json());
      }

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
          // ✅ REAL ORDER ID (Fallback to item.id for legacy items without a session)
          const sessionKey = item.sessionId || item.id;

          if (!sessionMap[sessionKey]) sessionMap[sessionKey] = [];
          sessionMap[sessionKey].push(item);
        });

        const membersList =
          g.members?.map((m: any) => m.name).join(", ") || "Unknown";

        Object.entries(sessionMap).forEach(([sessionKey, itemsArr]) => {
          const sUserId = itemsArr[0].userId;

          // Get unique restaurant names if the session contains items from multiple restaurants
          const restaurantNames =
            Array.from(
              new Set(
                itemsArr
                  .map((i: any) => i.menuItem?.restaurant?.name)
                  .filter(Boolean),
              ),
            ).join(", ") || "Unknown Vendor";

          const itemIds = itemsArr.map((i: any) => i.id);

          const total = itemsArr.reduce(
            (sum, i) => sum + (i.menuItem?.price || 0) * i.quantity,
            0,
          );
          const sessionUser = itemsArr[0].user || { name: "Squad Member" };

          // Define the overall status based on the items or the group
          const sessionStatus = itemsArr[0].status || g.status;

          groupOrdersMap.push({
            id: g.id,
            groupName: g.name,
            membersList: membersList,
            sessionId: sessionKey,
            sessionUserId: sUserId,
            itemIds: itemIds, // Passing all items in this exact session!
            isGroupOrder: true,
            user: { name: sessionUser.name },
            restaurant: { name: restaurantNames }, // Supports multiple
            orderItems: itemsArr,
            status:
              sessionStatus === "OPEN" || sessionStatus === "SUBMITTED"
                ? "PENDING"
                : sessionStatus,
            paymentStatus:
              sessionStatus === "OPEN" || sessionStatus === "SUBMITTED"
                ? "PENDING"
                : sessionStatus === "APPROVED"
                  ? "PAID"
                  : "REJECTED",
            totalAmount: total,
            createdAt: itemsArr[0].addedAt || g.createdAt,
          });
        });
      });

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

      setTeamOrders(combinedOrders);

      const pendingGroupCount = groupOrdersMap.filter(
        (g) => g.paymentStatus === "PENDING",
      ).length;

      setStats({
        ...fetchedStats,
        pendingApprovals: fetchedStats.pendingApprovals + pendingGroupCount,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleInviteResponse = async (
    inviteId: string,
    groupId: string,
    action: "ACCEPT" | "REJECT",
  ) => {
    setProcessingInvite({ groupId, action });

    try {
      const res = await fetch("/api/groups/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          inviteId,
          groupId,
          receiverId: user?.id,
        }),
      });

      if (res.ok) {
        if (action === "ACCEPT") {
          setShowInviteSuccess(true);
          fetchDashboardData();
        } else {
          await fetchDashboardData();
        }
      } else {
        alert("Failed to process invitation. Please try again.");
      }
    } catch (error) {
      console.error("Failed to respond to invite:", error);
      alert("An error occurred while processing the invitation.");
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleApprove = async (
    orderId: string,
    isGroupOrder?: boolean,
    sessionId?: string,
    sessionUserId?: string,
    sessionRestaurantId?: string,
    itemIds?: string[],
  ) => {
    setLoadingAction(sessionId || orderId);
    try {
      if (isGroupOrder && sessionUserId) {
        const res = await fetch(`/api/groups/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "APPROVED",
            approveUserId: sessionUserId,
            sessionId: sessionId, // ✅ CRITICAL
            itemIds: itemIds,
          }),
        });
        if (res.ok) fetchDashboardData();
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
        if (res.ok) fetchDashboardData();
      }
    } catch (error) {
      console.error("Approval failed:", error);
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
            sessionId: sessionId, // ✅ CRITICAL
            itemIds: itemIds,
          }),
        });
        if (res.ok) fetchDashboardData();
      } else {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            paymentStatus: "REJECTED",
          }),
        });
        if (res.ok) fetchDashboardData();
      }
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  const isIndia = user.country === "INDIA";
  const currencyCode = isIndia ? "INR" : "USD";
  const locale = isIndia ? "en-IN" : "en-US";
  const totalRevenue = isIndia ? stats.revenueINR : stats.revenueUSD;
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
      {/* 1. NOTIFICATION SECTION (FOR INVITES) */}
      {invites.length > 0 && (
        <div className="space-y-3">
          {invites.map((invite, index) => {
            const isAccepting =
              processingInvite?.groupId === invite.groupId &&
              processingInvite?.action === "ACCEPT";
            const isRejecting =
              processingInvite?.groupId === invite.groupId &&
              processingInvite?.action === "REJECT";
            const isAnyProcessing = processingInvite !== null;

            return (
              <div
                key={invite.id || invite.groupId || index}
                className="bg-orange-600 text-white p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl shadow-orange-900/20 animate-in fade-in slide-in-from-top-4 duration-500"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Bell className="w-5 h-5 text-white animate-bounce" />
                  </div>
                  <div>
                    <p className="font-bold">Group Invitation!</p>
                    <p className="text-sm opacity-90">
                      <span className="font-black">
                        {invite.group.host.name}
                      </span>{" "}
                      invited you to join{" "}
                      <span className="font-black italic">
                        &quot;{invite.group.name}&quot;
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() =>
                      handleInviteResponse(invite.id, invite.groupId, "ACCEPT")
                    }
                    disabled={isAnyProcessing}
                    className="flex-1 md:flex-none bg-white text-orange-600 px-6 py-2 rounded-xl font-black text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isAccepting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isAccepting ? "Joining..." : "Accept"}
                  </button>
                  <button
                    onClick={() =>
                      handleInviteResponse(invite.id, invite.groupId, "REJECT")
                    }
                    disabled={isAnyProcessing}
                    className="flex-1 md:flex-none bg-black/20 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRejecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {isRejecting ? "Ignoring..." : "Ignore"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BEAUTIFUL SUCCESS MODAL (After Accepting Invite) */}
      {showInviteSuccess && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-black text-zinc-900 mb-3">
              You&apos;re In!
            </h3>
            <p className="text-zinc-500 font-medium mb-8 leading-relaxed">
              You have successfully joined the squad. You can now add items to
              the group cart.
            </p>
            <button
              onClick={() => router.push("/manager/groups")}
              className="w-full py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-orange-600 transition-colors shadow-lg"
            >
              Go to Squad Orders
            </button>
          </div>
        </div>
      )}

      {/* 2. MANAGER HEADER */}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-24 h-24 text-blue-600" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Team Orders</p>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">
            {stats.orderCount}
          </h3>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24 text-orange-600" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Pending Approval</p>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">
            {stats.pendingApprovals}
          </h3>
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
              className={`h-full ${budgetPercentage > 85 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-zinc-900 text-lg">
            Team Activity ({user.country})
          </h3>
        </div>

        <div className="overflow-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-xs sticky top-0 z-10 outline outline-1 outline-zinc-100 shadow-sm">
              <tr>
                <th className="px-6 py-4 bg-zinc-50">Employee / Squad</th>
                <th className="px-6 py-4 bg-zinc-50">Time</th>
                <th className="px-6 py-4 bg-zinc-50">Items</th>
                <th className="px-6 py-4 bg-zinc-50">Status</th>
                <th className="px-6 py-4 bg-zinc-50">Total</th>
                <th className="px-6 py-4 bg-zinc-50 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {teamOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                      <td className="px-6 py-4 max-w-[250px] align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">
                            {order.user?.name}
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
                            className="text-[11px] text-zinc-500 font-medium mt-1 truncate"
                            title={`Members: ${order.membersList || "Unknown"}`}
                          >
                            <span className="font-bold">Members:</span>{" "}
                            {order.membersList || "Unknown"}
                          </div>
                        )}

                        <span className="text-[10px] text-zinc-400 block mt-1.5 font-bold uppercase tracking-wider">
                          {order.restaurant?.name ||
                            order.restaurantName ||
                            "Unknown Vendor"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-zinc-500 font-mono text-xs align-top whitespace-nowrap">
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

                      <td className="px-6 py-4 text-zinc-500 max-w-[300px] leading-relaxed align-top">
                        {itemSummary}
                      </td>

                      <td className="px-6 py-4 align-top">
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

                      <td className="px-6 py-4 font-black text-zinc-900 align-top">
                        {formatMoney(order.totalAmount)}
                      </td>

                      <td className="px-6 py-4 text-right align-top">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                handleApprove(
                                  order.groupOrderId || order.id,
                                  order.isGroupOrder,
                                  order.sessionId,
                                  order.sessionUserId,
                                  order.sessionRestaurantId,
                                  order.itemIds,
                                )
                              }
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
