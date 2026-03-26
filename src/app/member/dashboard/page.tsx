/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice } from "@/lib/utils"; // <-- Added import for formatting
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  Star,
  UtensilsCrossed,
  Users,
  Check,
  X,
  Bell,
  Loader2,
} from "lucide-react";

export default function MemberDashboard() {
  const { user } = useUserStore();
  const router = useRouter();

  const [recommendedRestaurants, setRecommendedRestaurants] = useState<any[]>(
    [],
  );
  const [invites, setInvites] = useState<any[]>([]);
  const [activeGroupsCount, setActiveGroupsCount] = useState(0);

  const [processingInviteId, setProcessingInviteId] = useState<string | null>(
    null,
  );

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const [resVendors, resInvites, resGroups] = await Promise.all([
        fetch("/api/vendors"),
        fetch(`/api/groups/invite?userId=${user.id}`),
        fetch(`/api/groups?region=${user.country}`),
      ]);

      if (resVendors.ok) {
        const all = await resVendors.json();
        const regional = all.filter(
          (r: any) => r.isActive && r.region === user.country,
        );
        setRecommendedRestaurants(regional.slice(0, 3));
      }

      if (resInvites.ok) {
        setInvites(await resInvites.json());
      }

      if (resGroups.ok) {
        const groups = await resGroups.json();
        const myActiveGroups = groups.filter(
          (g: any) =>
            g.hostId === user.id ||
            g.members?.some((m: any) => m.id === user.id),
        );
        setActiveGroupsCount(myActiveGroups.length);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInviteResponse = async (
    inviteId: string,
    groupId: string,
    action: "ACCEPT" | "REJECT",
  ) => {
    setProcessingInviteId(inviteId);

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
          router.push("/member/group-orders");
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
      setProcessingInviteId(null);
    }
  };

  if (!user) return null;

  // Determine budget based on region
  const dailyBudget = user.country === "INDIA" ? 5000 : 100;

  return (
    <div className="space-y-8">
      {/* 1. NOTIFICATION SECTION (FOR INVITES) */}
      {invites.length > 0 && (
        <div className="space-y-3">
          {invites.map((invite) => {
            const isProcessing = processingInviteId === invite.id;

            return (
              <div
                key={invite.id}
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
                    disabled={isProcessing}
                    className="flex-1 md:flex-none bg-white text-orange-600 px-6 py-2 rounded-xl font-black text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isProcessing ? "Joining..." : "Accept"}
                  </button>
                  <button
                    onClick={() =>
                      handleInviteResponse(invite.id, invite.groupId, "REJECT")
                    }
                    disabled={isProcessing}
                    className="flex-1 md:flex-none bg-black/20 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Ignore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-20" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold mb-6 uppercase tracking-widest">
            <MapPin className="w-3 h-3 text-orange-400" />
            {user.country === "INDIA"
              ? "Hyderabad Campus"
              : user.country + " Office"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Hungry, {user.name.split(" ")[0]}?
          </h1>
          <p className="text-lg text-zinc-400 mb-8 font-medium">
            {/* FIX: Dynamically format the budget using the user's country */}
            Your team has a budget of{" "}
            <span className="font-bold text-white">
              {formatPrice(dailyBudget, user.country)}
            </span>{" "}
            remaining for lunch today. Join a group to save on delivery!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/member/restaurants"
              className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2"
            >
              <UtensilsCrossed className="w-5 h-5" /> Browse Menu
            </Link>
            <Link
              href="/member/group-orders"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all backdrop-blur-sm flex items-center gap-2"
            >
              <Users className="w-5 h-5" /> Group Orders
            </Link>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-bold text-zinc-900">Trending Now</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Popular dishes in your office
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-zinc-900">Healthy Picks</h3>
          <p className="text-xs text-zinc-500 mt-1">Curated nutritious meals</p>
        </div>

        <Link
          href="/member/group-orders"
          className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-zinc-900">Active Groups</h3>
          <p className="text-xs text-blue-600 font-bold mt-1">
            {activeGroupsCount} live team sessions
          </p>
        </Link>

        <div className="p-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg text-white relative overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="font-bold text-xs uppercase tracking-wider opacity-80">
              PROMO
            </div>
            <div>
              <h3 className="font-black text-2xl">Free Drink</h3>
              <p className="text-xs opacity-90 mt-1">With team group orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECOMMENDATIONS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Recommended for You
          </h2>
          <Link
            href="/member/restaurants"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendedRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="group bg-white rounded-2xl border border-zinc-100 hover:shadow-xl transition-all hover:-translate-y-1 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400 text-xl uppercase italic">
                  {restaurant.name.charAt(0)}
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                  <Star className="w-3 h-3 text-green-600 fill-green-600" />
                  <span className="text-xs font-bold text-green-700">4.8</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg group-hover:text-orange-600 transition-colors">
                  {restaurant.name}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  {restaurant.menu?.length > 0
                    ? [...new Set(restaurant.menu.map((i: any) => i.category))]
                        .slice(0, 2)
                        .join(" • ")
                    : "Fresh • Hot • Delivery"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    25 min
                  </span>
                </div>
                <Link
                  href="/member/restaurants"
                  className="text-sm font-black text-orange-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
