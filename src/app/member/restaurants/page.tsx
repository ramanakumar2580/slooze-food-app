"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  MapPin,
  Star,
  Plus,
  Minus,
  Filter,
  Globe2,
  Building2,
  Trash2,
} from "lucide-react";

export default function MemberRestaurants() {
  const { user } = useUserStore();
  const { addItem, removeItem, items, clearCart } = useCartStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewRegion, setViewRegion] = useState("USA");

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewRegion(user.role === "ADMIN" ? "USA" : user.country);
    }
  }, [user]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/vendors");
        if (res.ok) {
          const allRestaurants = await res.json();
          const activeRestaurants = allRestaurants.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r: any) => r.isActive,
          );
          setRestaurants(activeRestaurants);
        }
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
      }
    };
    fetchRestaurants();
  }, [user]);

  // SMART ADD HANDLER
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddItem = (item: any, restaurant: any) => {
    if (items.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentCartItem = items[0] as any;
      const cartRegion = currentCartItem.region;

      if (cartRegion && cartRegion !== restaurant.region) {
        const confirmSwitch = window.confirm(
          `Your cart contains items from ${cartRegion}.\n\nDo you want to clear your cart and start a new order from ${restaurant.region}?`,
        );

        if (confirmSwitch) {
          clearCart();
          addItem({
            ...item,
            restaurantId: restaurant.id,
            region: restaurant.region,
          });
        }
        return;
      }
    }
    addItem({
      ...item,
      restaurantId: restaurant.id,
      region: restaurant.region,
    });
  };

  // NEW: Helper to get quantity of an item in the cart
  const getItemQuantity = (itemId: string) => {
    const cartItems = items.filter((i) => i.id === itemId);
    return cartItems.length;
  };

  // NEW: Helper to remove ONE instance of an item
  const handleRemoveItem = (itemId: string) => {
    // Find the LAST instance of this item in the cart to remove (LIFO)
    const itemToRemove = items
      .slice()
      .reverse()
      .find((i) => i.id === itemId);
    if (itemToRemove) {
      removeItem(itemToRemove.uniqueId);
    }
  };

  if (!user) return null;

  const filteredRestaurants = restaurants.filter((res) => {
    const matchesRegion = res.region === viewRegion;
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.menu.some((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Order Lunch
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">
            Showing active restaurants available in{" "}
            <span className="text-zinc-900 font-bold uppercase">
              {viewRegion}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {user.role === "ADMIN" && (
            <div className="flex bg-white border-2 border-zinc-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewRegion("USA")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewRegion === "USA"
                    ? "bg-zinc-900 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Globe2 className="w-3 h-3" /> USA
              </button>
              <button
                onClick={() => setViewRegion("INDIA")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewRegion === "INDIA"
                    ? "bg-zinc-900 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Building2 className="w-3 h-3" /> INDIA
              </button>
            </div>
          )}

          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-600 transition-colors" />
            <input
              type="text"
              placeholder="Search food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-zinc-100 focus:border-orange-600 focus:outline-none bg-white font-medium transition-all"
            />
          </div>
          <button className="h-12 w-12 flex items-center justify-center rounded-xl border-2 border-zinc-100 bg-white text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-2xl font-black text-zinc-400 uppercase">
                  {restaurant.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900">
                    {restaurant.name}
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                      <MapPin className="w-3 h-3" /> {restaurant.region}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                      <Star className="w-3 h-3 fill-orange-600" /> 4.8
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {restaurant.menu.map((item: any) => {
                const quantity = getItemQuantity(item.id);

                return (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                      quantity > 0
                        ? "border-orange-200 bg-orange-50/30"
                        : "border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5"
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <h4 className="font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">
                        {item.category}
                      </p>
                      <p className="text-sm font-black text-zinc-900 mt-2">
                        {formatPrice(item.price, restaurant.region)}
                      </p>
                    </div>

                    {/* ADD / REMOVE CONTROLS */}
                    <div className="flex items-center gap-2">
                      {quantity > 0 && (
                        <>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                          >
                            {quantity === 1 ? (
                              <Trash2 className="w-4 h-4" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>
                          <span className="font-black text-zinc-900 w-4 text-center text-sm">
                            {quantity}
                          </span>
                        </>
                      )}

                      <button
                        onClick={() => handleAddItem(item, restaurant)}
                        className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-90 ${
                          quantity > 0
                            ? "bg-zinc-900 text-white border-none hover:bg-orange-600"
                            : "bg-white border-2 border-zinc-100 text-zinc-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white"
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <h3 className="text-lg font-bold text-zinc-400">
              No active restaurants found in {viewRegion}
            </h3>
            <p className="text-zinc-400 text-sm">
              Try switching regions or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
