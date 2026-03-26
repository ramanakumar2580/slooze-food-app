/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import {
  Users,
  Clock,
  MapPin,
  Utensils,
  Trash2,
  UserX,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function ManagerGroupControl() {
  const { user } = useUserStore();
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/groups?region=${user.country}`);
      if (res.ok) {
        const data = await res.json();
        setActiveGroups(data.filter((g: any) => g.status === "OPEN"));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTerminateGroup = async (groupId: string) => {
    if (
      !confirm(
        "WARNING: This will completely delete the group and all associated items. Continue?",
      )
    )
      return;

    setLoadingAction(`terminate-${groupId}`);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (res.ok) fetchGroups();
    } catch (error) {
      console.error("Failed to terminate group:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (
      !confirm(
        "Remove this user from the squad? Their cart items will also be removed.",
      )
    )
      return;

    setLoadingAction(`remove-${groupId}-${memberId}`);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });

      if (res.ok) fetchGroups();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="bg-white border border-zinc-100 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-600" />
            Group Session Monitor
          </h1>
          <p className="text-zinc-500 mt-2 flex items-center gap-2 font-medium">
            Real-time oversight for team orders in
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-900 font-bold text-xs uppercase">
              <MapPin className="w-3 h-3" /> {user.country}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeGroups.map((group) => {
          const pendingItems = group.items || [];
          const completedOrders = group.orders || [];
          const approvedItems = completedOrders.flatMap((order: any) =>
            (order.orderItems || []).map((oi: any) => ({
              ...oi,
              userId: order.userId,
            })),
          );

          const allItems = [...pendingItems, ...approvedItems];

          const groupTotal = allItems.reduce(
            (sum: number, item: any) =>
              sum + (item.menuItem?.price || 0) * (item.quantity || 1),
            0,
          );

          const isTerminating = loadingAction === `terminate-${group.id}`;

          return (
            <div
              key={group.id}
              className="bg-white border-2 border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:border-orange-200 transition-all flex flex-col"
            >
              {/* GROUP HEADER */}
              <div className="p-8 border-b border-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-50/30">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900">
                      {group.name}
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">
                      Host:{" "}
                      <span className="text-zinc-900 font-bold">
                        {group.host.name}
                      </span>{" "}
                      • {group.members?.length || 0} Members joined
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Group Total So Far
                    </p>
                    <p className="text-3xl font-black text-orange-600">
                      {formatPrice(groupTotal, user.country)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTerminateGroup(group.id)}
                      disabled={isTerminating}
                      className="bg-white text-red-600 border border-red-200 px-6 py-4 rounded-2xl font-bold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      title="Terminate Group completely"
                    >
                      {isTerminating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                      {isTerminating ? "Terminating..." : "Terminate Group"}
                    </button>
                  </div>
                </div>
              </div>

              {/* MEMBER BREAKDOWN SECTION */}
              <div className="p-8 flex-1 flex flex-col min-h-0">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Utensils className="w-3 h-3" /> Individual Item Breakdown
                </h4>

                {/* THE FIX: Clamped max height to roughly 2 rows of users */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                  {group.members && group.members.length > 0 ? (
                    group.members.map((member: any) => {
                      const memberItems = allItems.filter(
                        (i: any) => i.userId === member.id,
                      );

                      const aggregatedMemberItems = memberItems.reduce(
                        (acc: any[], curr: any) => {
                          const existing = acc.find(
                            (i: any) => i.menuItemId === curr.menuItemId,
                          );
                          if (existing) {
                            existing.quantity += curr.quantity || 1;
                          } else {
                            acc.push({ ...curr, quantity: curr.quantity || 1 });
                          }
                          return acc;
                        },
                        [],
                      );

                      const memberTotal = memberItems.reduce(
                        (s: number, i: any) =>
                          s + (i.menuItem?.price || 0) * (i.quantity || 1),
                        0,
                      );

                      const isRemoving =
                        loadingAction === `remove-${group.id}-${member.id}`;

                      return (
                        <div
                          key={member.id}
                          className="p-5 rounded-2xl border border-zinc-100 bg-white hover:bg-zinc-50 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <span className="font-bold text-zinc-900 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                  <span className="truncate max-w-[120px]">
                                    {member.name}
                                  </span>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                      {member.role || "Member"}
                                    </span>

                                    {group.hostId === member.id && (
                                      <span className="text-[9px] bg-zinc-800 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                        Host
                                      </span>
                                    )}
                                  </div>
                                </span>
                                <p className="text-xs font-black text-zinc-400 mt-1">
                                  {formatPrice(memberTotal, user.country)}
                                </p>
                              </div>

                              {group.hostId !== member.id && (
                                <button
                                  onClick={() =>
                                    handleRemoveMember(group.id, member.id)
                                  }
                                  disabled={isRemoving}
                                  className="text-zinc-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0"
                                  title="Remove user from squad"
                                >
                                  {isRemoving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserX className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="mt-2 pt-4 border-t border-dashed border-zinc-100">
                              <div className="space-y-2 overflow-y-auto max-h-[100px] custom-scrollbar pr-2">
                                {aggregatedMemberItems.length > 0 ? (
                                  aggregatedMemberItems.map((item: any) => (
                                    <div
                                      key={item.id || item.menuItemId}
                                      className="flex justify-between items-start text-xs font-bold text-zinc-500"
                                    >
                                      <span className="flex items-start gap-2">
                                        <span className="text-blue-600 bg-blue-50 px-1.5 rounded flex-shrink-0 mt-0.5">
                                          {item.quantity || 1}x
                                        </span>
                                        <span className="leading-snug">
                                          {item.menuItem?.name ||
                                            "Deleted Item"}
                                        </span>
                                      </span>
                                      <span className="text-zinc-400 flex-shrink-0 ml-2 mt-0.5">
                                        {formatPrice(
                                          (item.menuItem?.price || 0) *
                                            (item.quantity || 1),
                                          user.country,
                                        )}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-zinc-400 italic">
                                    No orders placed yet for group
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-zinc-400 italic col-span-full text-center py-6">
                      No members have joined this session yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!isLoading && activeGroups.length === 0 && (
          <div className="py-24 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[3rem]">
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Clock className="w-10 h-10 text-zinc-200" />
            </div>
            <h3 className="text-zinc-900 font-black text-2xl tracking-tight">
              Quiet in the Office
            </h3>
            <p className="text-zinc-500 font-medium mt-2">
              There are no live team lunch sessions active in {user.country}.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
