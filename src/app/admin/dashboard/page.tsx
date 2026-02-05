"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import {
  BarChart3,
  DollarSign,
  Users,
  UtensilsCrossed,
  Globe2,
  MapPin,
  IndianRupee,
  Earth,
} from "lucide-react";

const USD_TO_INR = 83;

export default function AdminDashboard() {
  const { user } = useUserStore();

  const [adminRegion, setAdminRegion] = useState<"ALL" | "USA" | "INDIA">(
    "ALL",
  );
  const [adminCurrency, setAdminCurrency] = useState<"USD" | "INR">("USD");
  const [stats, setStats] = useState({
    revenueUSD: 0,
    revenueINR: 0,
    userCount: 0,
    restaurantCount: 0,
    orderCount: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const queryCountry = adminRegion === "ALL" ? "" : adminRegion;

        const statsRes = await fetch(
          `/api/dashboard?role=ADMIN&country=${queryCountry}`,
        );
        if (statsRes.ok) setStats(await statsRes.json());

        const ordersRes = await fetch(
          `/api/orders?view=GLOBAL&role=ADMIN&country=${queryCountry}`,
        );
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setRecentOrders(orders.slice(0, 3));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [adminRegion]);

  const displayRevenue = (() => {
    if (adminRegion === "ALL") {
      if (adminCurrency === "USD") {
        return stats.revenueUSD + stats.revenueINR / USD_TO_INR;
      } else {
        return stats.revenueUSD * USD_TO_INR + stats.revenueINR;
      }
    }

    if (adminRegion === "USA") {
      if (adminCurrency === "USD") {
        return stats.revenueUSD;
      } else {
        return stats.revenueUSD * USD_TO_INR;
      }
    }

    if (adminRegion === "INDIA") {
      if (adminCurrency === "INR") {
        return stats.revenueINR;
      } else {
        return stats.revenueINR / USD_TO_INR;
      }
    }

    return 0;
  })();

  const getConvertedPrice = (originalAmount: number, itemRegion: string) => {
    if (itemRegion === "INDIA" && adminCurrency === "USD")
      return originalAmount / USD_TO_INR;
    if (itemRegion === "USA" && adminCurrency === "INR")
      return originalAmount * USD_TO_INR;
    return originalAmount;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-zinc-500 mt-2">
            Global system overview for{" "}
            <span className="font-bold text-zinc-900">{user?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl text-white shadow-lg">
          <div className="flex bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setAdminRegion("ALL")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adminRegion === "ALL"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400"
              }`}
            >
              <Earth className="w-3 h-3" /> Global
            </button>
            <button
              onClick={() => setAdminRegion("USA")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adminRegion === "USA"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400"
              }`}
            >
              <Globe2 className="w-3 h-3" /> USA
            </button>
            <button
              onClick={() => setAdminRegion("INDIA")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adminRegion === "INDIA"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400"
              }`}
            >
              <MapPin className="w-3 h-3" /> IND
            </button>
          </div>
          <div className="w-px h-6 bg-zinc-700" />
          <div className="flex bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setAdminCurrency("USD")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adminCurrency === "USD"
                  ? "bg-orange-600 text-white"
                  : "text-zinc-400"
              }`}
            >
              <DollarSign className="w-3 h-3" /> USD
            </button>
            <button
              onClick={() => setAdminCurrency("INR")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adminCurrency === "INR"
                  ? "bg-orange-600 text-white"
                  : "text-zinc-400"
              }`}
            >
              <IndianRupee className="w-3 h-3" /> INR
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Total Revenue</p>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            {new Intl.NumberFormat(
              adminCurrency === "INR" ? "en-IN" : "en-US",
              {
                style: "currency",
                currency: adminCurrency,
              },
            ).format(displayRevenue)}
          </h3>
        </div>

        <Link
          href="/admin/employees"
          className="group bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Active Users</p>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            {stats.userCount}
          </h3>
        </Link>

        <Link
          href="/admin/restaurants"
          className="group bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Restaurants</p>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            {stats.restaurantCount}
          </h3>
        </Link>

        <Link
          href="/admin/orders"
          className="group bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:border-pink-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-pink-100 rounded-lg group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Total Orders</p>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            {stats.orderCount}
          </h3>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <h3 className="font-bold text-zinc-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-500">No recent orders found.</p>
            ) : (
              recentOrders.map((order) => {
                const convertedPrice = getConvertedPrice(
                  order.totalAmount,
                  order.restaurant?.region,
                );

                return (
                  <div key={order.id} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-xs uppercase group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                      {order.user?.name.substring(0, 2) || "U"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900">
                        {order.user?.name || "Unknown User"} placed an order
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(order.createdAt).toLocaleTimeString()} •{" "}
                        {order.restaurant?.name} ({order.restaurant?.region})
                      </p>
                    </div>
                    <span className="text-sm font-black text-zinc-900">
                      {new Intl.NumberFormat(
                        adminCurrency === "INR" ? "en-IN" : "en-US",
                        {
                          style: "currency",
                          currency: adminCurrency,
                        },
                      ).format(convertedPrice)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <h3 className="font-bold text-zinc-900 mb-6">System Health</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-green-700 text-sm">
                  Payment Gateway (Stripe)
                </span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded border border-green-200">
                Operational
              </span>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-green-700 text-sm">
                  Database (NeonDB/Prisma)
                </span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded border border-green-200">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
