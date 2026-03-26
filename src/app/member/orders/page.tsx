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
  Users,
} from "lucide-react";

export default function MemberOrders() {
  const { user } = useUserStore();

  const [activeTab, setActiveTab] = useState<"PERSONAL" | "GROUP">("PERSONAL");

  // States
  const [orders, setOrders] = useState<any[]>([]); // Personal Orders
  const [completedGroupOrders, setCompletedGroupOrders] = useState<any[]>([]); // Permanent Group Orders
  const [groupOrders, setGroupOrders] = useState<any[]>([]); // Live/Active Group Carts
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    try {
      // 1. FETCH ALL ORDERS FROM HISTORY
      const res = await fetch(`/api/orders?userId=${user.id}&view=MY_ORDERS`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();

        // --- PERSONAL ORDERS ---
        const personalOnly = data.filter((order: any) => !order.isGroupOrder);
        const updatedPersonal = personalOnly.map((order: any) => {
          const orderTime = new Date(order.createdAt).getTime();
          const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
          let finalStatus = order.status;

          if (finalStatus === "PREPARING" && orderTime < thirtyMinsAgo) {
            finalStatus = "DELIVERED";
          }

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

          return { ...order, status: finalStatus, orderItems: aggregatedItems };
        });
        setOrders(updatedPersonal);

        // --- COMPLETED GROUP ORDERS (Never disappear!) ---
        const groupOnly = data.filter((order: any) => order.isGroupOrder);
        const updatedGroupOnly = groupOnly.map((order: any) => {
          const orderTime = new Date(order.createdAt).getTime();
          const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
          let finalStatus = order.status;

          if (finalStatus === "PREPARING" && orderTime < thirtyMinsAgo) {
            finalStatus = "DELIVERED";
          }

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

          return { ...order, status: finalStatus, orderItems: aggregatedItems };
        });
        setCompletedGroupOrders(updatedGroupOnly);
      }

      // 2. FETCH LIVE/ACTIVE GROUPS (For pending cart items)
      const resGroup = await fetch(`/api/groups?region=${user.country}`, {
        cache: "no-store",
      });
      if (resGroup.ok) {
        const gData = await resGroup.json();
        const myGroups = gData.filter(
          (g: any) =>
            g.hostId === user.id ||
            g.members?.some((m: any) => m.id === user.id),
        );
        setGroupOrders(myGroups);
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

  // Handle final, official orders (Personal OR Group)
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

  // Handle temporary, pending group items
  const handleCancelPending = async (
    groupId: string,
    rejectUserId: string,
    itemIds: string[],
  ) => {
    if (!confirm("Are you sure you want to cancel these pending items?"))
      return;

    setLoadingAction(`pending-${itemIds[0]}`);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          rejectUserId: rejectUserId,
          itemIds: itemIds,
        }),
      });

      if (res.ok) fetchMyOrders();
    } catch (error) {
      console.error("Cancellation failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // =========================================================================
  // Combine Pending Items + Completed History into the UI Cards
  // =========================================================================
  const squadCards = (() => {
    const cards: any[] = [];

    // 1. Map PENDING items from live group carts
    groupOrders.forEach((group) => {
      const membersList =
        group.members?.map((m: any) => m.name).join(", ") || "Unknown";
      const transactions: any = {};

      if (group.items && group.items.length > 0) {
        group.items.forEach((item: any) => {
          const restaurantId = item.menuItem?.restaurantId || "unknown";

          // 🔥 CRITICAL FIX: Group strictly by the new Session ID, never by time!
          const sessionKey = item.sessionId || item.id;
          const txKey = `pending-${group.id}-${item.userId}-${restaurantId}-${sessionKey}`;

          if (!transactions[txKey]) {
            transactions[txKey] = {
              isFinalOrder: false,
              id: txKey,
              groupId: group.id,
              groupName: group.name,
              personName: item.user?.name || "Unknown",
              userId: item.userId,
              isMe: item.userId === user?.id,
              membersList: membersList,
              createdAt: item.addedAt || group.createdAt,
              status: "PENDING APPROVAL",
              restaurantName:
                item.menuItem?.restaurant?.name || "Pending Order",
              totalAmount: 0,
              items: [],
              itemIds: [],
            };
          }

          transactions[txKey].itemIds.push(item.id);

          const existingItem = transactions[txKey].items.find(
            (i: any) => i.menuItemId === item.menuItemId,
          );
          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            transactions[txKey].items.push({ ...item });
          }

          transactions[txKey].totalAmount +=
            (item.menuItem?.price || 0) * item.quantity;
        });

        Object.values(transactions).forEach((tx) => cards.push(tx));
      }
    });

    // 2. Map REAL completed group orders from history (Ensures they never vanish!)
    completedGroupOrders.forEach((order: any) => {
      // Try to find the live group to get the current member list, fallback to basic text if group was deleted
      const liveGroup = groupOrders.find((g) => g.id === order.groupOrderId);
      const membersList = liveGroup
        ? liveGroup.members?.map((m: any) => m.name).join(", ")
        : "Squad Finalized / Closed";

      const groupName =
        liveGroup?.name || order.groupOrder?.name || "Squad Order";

      cards.push({
        isFinalOrder: true,
        id: order.id,
        groupId: order.groupOrderId,
        groupName: groupName,
        personName: order.user?.name || "You",
        userId: order.userId,
        isMe: true, // Since we fetched MY_ORDERS, these belong to the current user
        membersList: membersList,
        restaurantName: order.restaurant?.name || "Restaurant",
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.orderItems, // Already aggregated securely
        itemIds: [],
      });
    });

    return cards.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  })();

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-zinc-500 mt-2">
            Tracking orders for{" "}
            <span className="font-bold text-zinc-900 uppercase">
              {user.role === "ADMIN" ? "Global" : user.country}
            </span>{" "}
            Region
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("PERSONAL")}
            className={`flex-1 md:px-8 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === "PERSONAL"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab("GROUP")}
            className={`flex-1 md:px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "GROUP"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Users className="w-4 h-4" /> Squad Orders
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ================================================= */}
        {/* PERSONAL ORDERS TAB                               */}
        {/* ================================================= */}
        {activeTab === "PERSONAL" &&
          (orders.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 font-medium bg-white rounded-3xl border border-zinc-100">
              You haven&apos;t placed any personal orders yet.
            </div>
          ) : (
            orders.map((order) => {
              const isActive =
                order.status === "PENDING" || order.status === "PREPARING";
              const isPreparing = order.status === "PREPARING";
              const isCancelled = order.status === "CANCELLED";
              const isDelivered = order.status === "DELIVERED";
              const isLoading = loadingAction === order.id;
              const orderRegion = order.restaurant?.region || user.country;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl p-6 border transition-all ${isActive ? "border-orange-200 shadow-lg shadow-orange-900/5 ring-1 ring-orange-100" : isCancelled ? "border-red-100 bg-red-50/10" : "border-zinc-100 shadow-sm hover:shadow-md"}`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black uppercase ${isActive ? "bg-orange-100 text-orange-600" : isCancelled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                      >
                        {order.restaurant?.name.charAt(0) || "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                          {order.restaurant?.name || "Unknown Vendor"}
                          <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200 flex items-center gap-1">
                            <MapPin className="w-2 h-2" /> {orderRegion}
                          </span>
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mt-1">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString()} at{" "}
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>{order.orderItems.length} Items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> {order.status}
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                          <XCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                        </span>
                      )}

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
                            key={item.id || item.menuItemId}
                            className="text-sm font-medium text-zinc-700 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                            {item.menuItem?.name || "Unknown Item"} (x
                            {item.quantity})
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isActive && (
                      <div className="flex flex-col gap-3 justify-end">
                        {isPreparing && (
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
                        )}

                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={isLoading}
                          className="w-full md:w-auto md:ml-auto px-6 py-2.5 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
          ))}

        {/* ================================================= */}
        {/* NEW SQUAD ORDERS TAB (EVERY TRANSACTION IS A CARD)*/}
        {/* ================================================= */}
        {activeTab === "GROUP" &&
          (squadCards.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 font-medium bg-white rounded-3xl border border-zinc-100">
              No transactions found for your groups.
            </div>
          ) : (
            squadCards.map((card) => {
              const isActive =
                card.status === "PENDING" ||
                card.status === "PREPARING" ||
                card.status === "PENDING APPROVAL";

              const isPreparing = card.status === "PREPARING";

              const isCancelled = card.status === "CANCELLED";
              const isDelivered =
                card.status === "DELIVERED" || card.status === "COMPLETED";

              const isCancelling =
                loadingAction ===
                (card.isFinalOrder ? card.id : `pending-${card.itemIds?.[0]}`);

              return (
                <div
                  key={card.id}
                  className={`bg-white rounded-3xl p-6 border transition-all mb-4 ${isActive ? "border-orange-200 shadow-lg shadow-orange-900/5 ring-1 ring-orange-100" : isCancelled ? "border-red-100 bg-red-50/10" : "border-zinc-100 shadow-sm hover:shadow-md"}`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black uppercase ${isActive ? "bg-orange-100 text-orange-600" : isCancelled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                      >
                        {card.restaurantName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                          {card.restaurantName}
                          <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {card.groupName}
                          </span>
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mt-1">
                          <span className="text-zinc-900 font-bold">
                            Ordered by: {card.isMe ? "You" : card.personName}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(card.createdAt).toLocaleDateString()} at{" "}
                            {new Date(card.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>{card.items.length} Items</span>
                        </div>
                        <div className="text-xs font-medium text-zinc-400 mt-1">
                          <span className="font-bold text-zinc-500">
                            Squad Members:
                          </span>{" "}
                          {card.membersList}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> {card.status}
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                          <XCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                        </span>
                      )}

                      <span className="font-black text-zinc-900 text-lg">
                        {formatPrice(card.totalAmount, user.country)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Items
                      </p>
                      <ul className="space-y-1">
                        {card.items.map((item: any) => (
                          <li
                            key={item.id || item.menuItemId}
                            className="text-sm font-medium text-zinc-700 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                            {item.menuItem?.name || "Deleted Item"} (x
                            {item.quantity})
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* ETA BOX AND CANCEL BUTTON FOR SQUAD ORDERS */}
                    {isActive && (
                      <div className="flex flex-col gap-3 justify-end">
                        {isPreparing && (
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
                        )}

                        {card.isMe && (
                          <button
                            onClick={() =>
                              card.isFinalOrder
                                ? handleCancelOrder(card.id)
                                : handleCancelPending(
                                    card.groupId,
                                    card.userId,
                                    card.itemIds,
                                  )
                            }
                            disabled={isCancelling}
                            className="w-full md:w-auto md:ml-auto px-6 py-2.5 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isCancelling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {isCancelling ? "Cancelling..." : "Cancel Order"}
                          </button>
                        )}
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
          ))}
      </div>
    </div>
  );
}
