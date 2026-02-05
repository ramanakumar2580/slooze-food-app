/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from "lucide-react";

export default function MemberDashboard() {
  const { user } = useUserStore();

  // 1. Live State for Database Restaurants
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<any[]>(
    [],
  );

  // 2. Fetch Active Regional Restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/vendors");
        if (res.ok) {
          const allRestaurants = await res.json();
          // FILTER: Only show restaurants that are ACTIVE and in the MEMBER'S REGION
          const regionalActiveRestaurants = allRestaurants.filter(
            (r: any) => r.isActive && r.region === user.country,
          );
          // Just take the top 3 for the dashboard view
          setRecommendedRestaurants(regionalActiveRestaurants.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
      }
    };

    fetchRestaurants();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold mb-6">
            <MapPin className="w-3 h-3 text-orange-400" />
            {user.country === "INDIA"
              ? "Hyderabad Campus"
              : user.country + " Office"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Hungry, {user.name.split(" ")[0]}?
          </h1>
          <p className="text-lg text-zinc-400 mb-8 font-medium">
            Your team has a budget of $25.00 remaining for lunch today. Order
            before 11:30 AM for guaranteed delivery.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/member/restaurants"
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Browse Menu
            </Link>
            <Link
              href="/member/orders"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all backdrop-blur-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Track Orders
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-bold text-zinc-900">Trending Now</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Most ordered dishes this week
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-zinc-900">Healthy Picks</h3>
          <p className="text-xs text-zinc-500 mt-1">Under 500 calories</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-zinc-900">Order Again</h3>
          <p className="text-xs text-zinc-500 mt-1">Re-order your favorites</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg text-white relative overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="font-bold text-xs uppercase tracking-wider opacity-80">
              PROMO
            </div>
            <div>
              <h3 className="font-black text-2xl">Free Drink</h3>
              <p className="text-xs opacity-90 mt-1">With every burger order</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME RESTAURANTS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">
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
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400 text-xl uppercase">
                  {restaurant.name.charAt(0)}
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                  <Star className="w-3 h-3 text-green-600 fill-green-600" />
                  <span className="text-xs font-bold text-green-700">4.8</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">
                  {restaurant.name}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  {restaurant.menu?.length > 0
                    ? [...new Set(restaurant.menu.map((i: any) => i.category))]
                        .slice(0, 3)
                        .join(" • ")
                    : "Tiffins • Meals • Fast Food"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    25-30 min
                  </span>
                </div>
                <Link
                  href="/member/restaurants"
                  className="text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
          {recommendedRestaurants.length === 0 && (
            <div className="col-span-full py-10 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
              <p className="text-zinc-400 font-medium">
                No active restaurants available in {user.country} today.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
