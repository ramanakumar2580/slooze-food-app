/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/store/useUserStore";
import {
  Users,
  Clock,
  MapPin,
  Utensils,
  Trash2,
  UserX,
  Loader2,
  Earth,
  Globe2,
  DollarSign,
  IndianRupee,
  ShieldAlert,
} from "lucide-react";

const USD_TO_INR = 83;

export default function AdminGroupControl() {
  const { user } = useUserStore();
  const [adminRegion, setAdminRegion] = useState<"ALL" | "USA" | "INDIA">(
    "ALL",
  );
  const [adminCurrency, setAdminCurrency] = useState<"USD" | "INR">("USD");

  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      // ✅ FIX: Now calling the dedicated God-Level Admin API
      const res = await fetch(`/api/admin/groups`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllGroups(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  const handleTerminateGroup = async (groupId: string) => {
    if (!confirm("GOD LEVEL OVERRIDE: Delete this group globally?")) return;
    setLoadingAction(`terminate-${groupId}`);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (res.ok) fetchGroups();
    } catch (error) {
      console.error("Failed to terminate group:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (!confirm("Remove user and their items from this squad?")) return;
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

  const getConvertedPrice = (amount: number, itemRegion: string) => {
    const isInd =
      itemRegion?.toUpperCase() === "INDIA" ||
      itemRegion?.toUpperCase() === "IND";
    if (isInd && adminCurrency === "USD") return amount / USD_TO_INR;
    if (!isInd && adminCurrency === "INR") return amount * USD_TO_INR;
    return amount;
  };

  const filteredGroups = allGroups.filter((g) => {
    if (adminRegion === "ALL") return true;
    const groupLoc = g.region || g.host?.country || "";
    return groupLoc.toUpperCase() === adminRegion.toUpperCase();
  });

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
      {/* 1. CONSTANT STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md pb-6 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-blue-600" />
              Global Squad Monitor
            </h1>
            <p className="text-zinc-500 mt-2 font-medium">
              Showing{" "}
              <span className="text-blue-600 font-bold">
                {filteredGroups.length} squads
              </span>{" "}
              in {adminRegion === "ALL" ? "Global Database" : adminRegion}.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl text-white shadow-lg">
            <div className="flex bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setAdminRegion("ALL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${adminRegion === "ALL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                <Earth className="w-3 h-3" /> Global
              </button>
              <button
                onClick={() => setAdminRegion("USA")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${adminRegion === "USA" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                <Globe2 className="w-3 h-3" /> USA
              </button>
              <button
                onClick={() => setAdminRegion("INDIA")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${adminRegion === "INDIA" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                <MapPin className="w-3 h-3" /> IND
              </button>
            </div>
            <div className="w-px h-6 bg-zinc-700" />
            <div className="flex bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setAdminCurrency("USD")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminCurrency === "USD" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                <DollarSign className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAdminCurrency("INR")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminCurrency === "INR" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                <IndianRupee className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        <div className="grid grid-cols-1 gap-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">
                Accessing Database...
              </p>
            </div>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((group) => {
              const groupRegion = group.region || group.host?.country || "USA";
              const allItems = [
                ...(group.items || []),
                ...(group.orders?.flatMap((o: any) =>
                  o.orderItems.map((oi: any) => ({ ...oi, userId: o.userId })),
                ) || []),
              ];
              const rawTotal = allItems.reduce(
                (sum, i) => sum + (i.menuItem?.price || 0) * (i.quantity || 1),
                0,
              );
              const isTerminating = loadingAction === `terminate-${group.id}`;

              return (
                <div
                  key={group.id}
                  className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-8 border-b border-zinc-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-zinc-50/50 to-white text-left">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 relative">
                        <Users className="w-8 h-8 text-blue-600" />
                        <span
                          className={`absolute -top-2 -right-2 px-2 py-0.5 rounded text-[8px] font-black bg-blue-600 text-white uppercase`}
                        >
                          {group.status}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-zinc-900">
                          {group.name}{" "}
                          <span className="text-xs bg-zinc-200 px-2 py-0.5 rounded ml-2 uppercase tracking-tighter">
                            {groupRegion}
                          </span>
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium">
                          Host:{" "}
                          <span className="font-bold text-zinc-900">
                            {group.host?.name || "Unknown"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Squad Total
                        </p>
                        <p className="text-3xl font-black text-zinc-900">
                          {new Intl.NumberFormat(
                            adminCurrency === "INR" ? "en-IN" : "en-US",
                            { style: "currency", currency: adminCurrency },
                          ).format(getConvertedPrice(rawTotal, groupRegion))}
                        </p>
                      </div>
                      <button
                        onClick={() => handleTerminateGroup(group.id)}
                        disabled={isTerminating}
                        className="bg-red-50 text-red-600 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                      >
                        {isTerminating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* MEMBERS SECTION - GALLERY STYLE */}
                  <div className="p-8 flex flex-wrap gap-4 text-left">
                    <h4 className="w-full text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Utensils className="w-3 h-3" /> Member Carts & Sessions
                    </h4>
                    {group.members?.map((member: any) => {
                      const memberItems = allItems.filter(
                        (i) => i.userId === member.id,
                      );
                      const memberTotal = memberItems.reduce(
                        (s, i) =>
                          s + (i.menuItem?.price || 0) * (i.quantity || 1),
                        0,
                      );
                      const isRemoving =
                        loadingAction === `remove-${group.id}-${member.id}`;

                      if (memberItems.length === 0) {
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-4 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 opacity-60 min-w-[220px]"
                          >
                            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-400 uppercase text-xs">
                              {member.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-zinc-500 text-xs truncate">
                                {member.name}
                              </p>
                              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">
                                Idle
                              </p>
                            </div>
                            {group.hostId !== member.id && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(group.id, member.id)
                                }
                                disabled={isRemoving}
                                className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-auto shrink-0"
                              >
                                {isRemoving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col w-full md:w-[280px] rounded-[2rem] border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden group/member"
                        >
                          <div className="p-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-blue-600 shadow-sm border border-blue-100 text-xs shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="font-bold text-zinc-900 text-xs truncate w-24">
                                  {member.name}
                                </p>
                                <p className="text-[10px] font-black text-blue-600">
                                  {new Intl.NumberFormat(
                                    adminCurrency === "INR" ? "en-IN" : "en-US",
                                    {
                                      style: "currency",
                                      currency: adminCurrency,
                                    },
                                  ).format(
                                    getConvertedPrice(memberTotal, groupRegion),
                                  )}
                                </p>
                              </div>
                            </div>
                            {group.hostId !== member.id && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(group.id, member.id)
                                }
                                disabled={isRemoving}
                                className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                              >
                                {isRemoving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="p-4 space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar bg-white text-left">
                            {memberItems.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex justify-between items-start text-[10px] font-bold text-zinc-500 bg-zinc-50/30 p-2 rounded-xl border border-transparent hover:border-zinc-100 transition-colors"
                              >
                                <span className="flex-1 truncate pr-2 text-left">
                                  <span className="text-blue-500">
                                    {item.quantity}x
                                  </span>{" "}
                                  {item.menuItem?.name || "Item"}
                                </span>
                                <span className="text-zinc-400 shrink-0">
                                  {new Intl.NumberFormat(
                                    adminCurrency === "INR" ? "en-IN" : "en-US",
                                    {
                                      style: "currency",
                                      currency: adminCurrency,
                                    },
                                  ).format(
                                    getConvertedPrice(
                                      (item.menuItem?.price || 0) *
                                        item.quantity,
                                      groupRegion,
                                    ),
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center bg-white border-2 border-dashed border-zinc-200 rounded-[3rem]">
              <Clock className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-zinc-900 font-black text-2xl">
                No Active Squads
              </h3>
              <p className="text-zinc-500">
                Database Status: {allGroups.length} total, none match region{" "}
                {adminRegion}.
              </p>
            </div>
          )}
        </div>
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
