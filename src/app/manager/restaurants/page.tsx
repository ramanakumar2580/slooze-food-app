/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { MapPin, Power, Store, Utensils, Loader2 } from "lucide-react";

export default function ManagerRestaurants() {
  const { user } = useUserStore();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const allRestaurants = await res.json();
        const myRegionRestaurants = allRestaurants.filter(
          (r: any) => r.region === user.country,
        );
        setRestaurants(myRegionRestaurants);
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setLoadingAction(id);
    try {
      const res = await fetch("/api/vendors/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchRestaurants();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
          Restaurant Control
        </h1>
        <p className="text-zinc-500 mt-2">
          Enable or disable vendors for the{" "}
          <span className="font-bold text-zinc-900 uppercase">
            {user.country}
          </span>{" "}
          region.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => {
          const isActive = restaurant.isActive;
          const isLoading = loadingAction === restaurant.id;

          return (
            <div
              key={restaurant.id}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                isActive
                  ? "bg-white border-zinc-100 shadow-sm"
                  : "bg-zinc-50 border-zinc-200 opacity-75 grayscale-[0.5]"
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner uppercase ${
                      isActive
                        ? "bg-orange-50 text-orange-600"
                        : "bg-zinc-200 text-zinc-400"
                    }`}
                  >
                    {restaurant.name.charAt(0)}
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-zinc-200 text-zinc-500 border-zinc-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-zinc-400"}`}
                    />
                    {isActive ? "Live" : "Offline"}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {restaurant.region}
                    </span>
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3" />{" "}
                      {restaurant.menu?.length || 0} Items
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Store Status
                  </span>
                  <button
                    onClick={() => toggleStatus(restaurant.id, isActive)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                      isActive
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Power className="w-3.5 h-3.5" />
                    )}
                    {isLoading
                      ? "Updating..."
                      : isActive
                        ? "Disable Vendor"
                        : "Enable Vendor"}
                  </button>
                </div>
              </div>
              <div
                className={`h-1.5 w-full ${isActive ? "bg-orange-500" : "bg-zinc-300"}`}
              />
            </div>
          );
        })}

        {restaurants.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
            <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-zinc-900 font-bold">No Restaurants Found</h3>
            <p className="text-zinc-500 text-sm">
              There are no live vendors assigned to the {user.country} region
              yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
