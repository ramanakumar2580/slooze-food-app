"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice } from "@/lib/utils";
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Send,
  Loader2,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Helper to fetch restaurant details (name & region) for items in the cart
const getRestaurantDetails = async (restaurantId: string) => {
  try {
    const res = await fetch("/api/vendors");
    if (res.ok) {
      const vendors = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vendor = vendors.find((v: any) => v.id === restaurantId);
      return vendor ? { name: vendor.name, region: vendor.region } : null;
    }
  } catch {
    console.error("Failed to fetch vendor info");
  }
  return null;
};

export default function CartPage() {
  const { items, removeItem, total, clearCart } = useCartStore();
  const { user } = useUserStore();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);

  // State to store fetched restaurant info (Name & Region) for each item
  const [cartMetadata, setCartMetadata] = useState<
    Record<string, { name: string; region: string }>
  >({});

  // 1. Fetch Restaurant Names & Regions on Load
  useEffect(() => {
    const loadMetadata = async () => {
      const uniqueRestaurantIds = Array.from(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Set(items.map((i: any) => i.restaurantId)),
      );
      const metadata: Record<string, { name: string; region: string }> = {};

      for (const id of uniqueRestaurantIds) {
        if (id) {
          const details = await getRestaurantDetails(id as string);
          if (details) {
            metadata[id as string] = details;
          }
        }
      }
      setCartMetadata(metadata);
    };

    if (items.length > 0) loadMetadata();
  }, [items]);

  if (!user) return null;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      const ordersByRestaurant = items.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc, item: any) => {
          if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
          acc[item.restaurantId].push(item);
          return acc;
        },
        {} as Record<string, typeof items>,
      );

      const orderPromises = Object.entries(ordersByRestaurant).map(
        ([restaurantId, restaurantItems]) => {
          const orderTotal = restaurantItems.reduce(
            (sum, item) => sum + item.price,
            0,
          );

          return fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              restaurantId: restaurantId,
              totalAmount: orderTotal,
              role: user.role,
              items: restaurantItems.map((i) => ({ id: i.id, quantity: 1 })),
            }),
          });
        },
      );

      await Promise.all(orderPromises);
      clearCart();
      router.push("/member/orders");
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Something went wrong processing your order.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-zinc-300" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900">
            Your cart is empty
          </h2>
          <p className="text-zinc-500 mt-2">
            Looks like you haven&apos;t added any lunch yet.
          </p>
        </div>
        <Link
          href="/member/restaurants"
          className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  const cartRegion =
    items.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cartMetadata[(items[0] as any).restaurantId]?.region
      : user.country;

  const canPay = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
          Your Order
        </h1>

        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-zinc-100">
            {items.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const restId = (item as any).restaurantId;
              const restaurantInfo = cartMetadata[restId];

              return (
                <div
                  key={item.uniqueId}
                  className="p-6 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-lg font-black text-zinc-400">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">{item.name}</h3>
                      {/* SHOW RESTAURANT NAME HERE */}
                      <p className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        {restaurantInfo ? restaurantInfo.name : "Loading..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Price formatted by Restaurant Region */}
                    <span className="font-bold text-zinc-900">
                      {formatPrice(
                        item.price,
                        restaurantInfo?.region || user.country,
                      )}
                    </span>
                    <button
                      onClick={() => removeItem(item.uniqueId)}
                      disabled={isProcessing}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm h-fit sticky top-24">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">
            Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="font-bold text-zinc-900">
                {/* Total formatted by Cart Region */}
                {formatPrice(total(), cartRegion || user.country)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Service Fee</span>
              <span className="font-bold text-zinc-900">
                {formatPrice(0, cartRegion || user.country)}
              </span>
            </div>
            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="font-black text-zinc-900 text-lg">Total</span>
              <span className="font-black text-orange-600 text-2xl">
                {formatPrice(total(), cartRegion || user.country)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {canPay && (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-zinc-400" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-900 uppercase">
                    Corporate Card
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    **** 4242
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                canPay
                  ? "bg-zinc-900 text-white hover:bg-orange-600 hover:shadow-orange-900/20"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-900/20"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : canPay ? (
                <>
                  Confirm & Pay <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Request Approval <Send className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-zinc-400 font-medium">
              {canPay
                ? "Transaction will be processed immediately."
                : "Your manager must approve this order."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
