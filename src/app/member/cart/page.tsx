/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice } from "@/lib/utils";
import {
  Trash2,
  ShoppingBag,
  Loader2,
  Store,
  Users,
  User,
  X,
  ChevronLeft,
  Crown,
  ChevronRight,
  CheckCircle2, // Added for the success modal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const getRestaurantDetails = async (restaurantId: string) => {
  try {
    const res = await fetch("/api/vendors");
    if (res.ok) {
      const vendors = await res.json();
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
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // New state for success popup

  const [modalStep, setModalStep] = useState<"CHOICE" | "SELECT_GROUP">(
    "CHOICE",
  );

  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [cartMetadata, setCartMetadata] = useState<
    Record<string, { name: string; region: string }>
  >({});

  useEffect(() => {
    if (!user) return; // Wait for user to load

    const currentCartOwner = localStorage.getItem("cartOwnerId");

    // If there is no owner yet, brand this cart with the current user's ID
    if (!currentCartOwner) {
      localStorage.setItem("cartOwnerId", user.id);
    }
    // If the cart owner is SOMEONE ELSE, nuke the cart immediately and claim it!
    else if (currentCartOwner !== user.id) {
      clearCart();
      localStorage.setItem("cartOwnerId", user.id);
    }
  }, [user, clearCart]);

  useEffect(() => {
    const loadMetadata = async () => {
      const uniqueIds = Array.from(
        new Set(items.map((i: any) => i.restaurantId)),
      );
      const metadata: Record<string, { name: string; region: string }> = {};
      for (const id of uniqueIds) {
        if (id) {
          const details = await getRestaurantDetails(id as string);
          if (details) metadata[id as string] = details;
        }
      }
      setCartMetadata(metadata);
    };
    if (items.length > 0) loadMetadata();
  }, [items]);

  const fetchMyGroups = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/groups?region=${user.country}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const allGroups = await res.json();
        const filtered = allGroups.filter(
          (g: any) =>
            g.hostId === user.id ||
            g.members?.some((m: any) => m.id === user.id),
        );
        setMyGroups(filtered);
      }
    } catch {
      console.error("Failed to fetch groups");
    }
  };

  const handleCheckoutClick = () => {
    fetchMyGroups();
    setModalStep("CHOICE");
    setShowDecisionModal(true);
  };

  const processOrder = async (type: "PERSONAL" | "GROUP", groupId?: string) => {
    setIsProcessing(true);
    setShowDecisionModal(false);

    try {
      if (type === "PERSONAL") {
        const ordersByRestaurant = items.reduce(
          (acc, item: any) => {
            if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
            acc[item.restaurantId].push(item);
            return acc;
          },
          {} as Record<string, typeof items>,
        );

        const orderPromises = Object.entries(ordersByRestaurant).map(
          ([restaurantId, restaurantItems]) => {
            return fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                restaurantId,
                totalAmount: restaurantItems.reduce(
                  (sum, i) => sum + i.price,
                  0,
                ),
                role: user?.role,
                items: restaurantItems.map((i) => ({ id: i.id, quantity: 1 })),
              }),
            });
          },
        );
        await Promise.all(orderPromises);
        clearCart();
        setShowSuccess(true); // Trigger success modal instead of instant redirect
      } else {
        const groupPromises = items.map((item: any) =>
          fetch("/api/groups/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupOrderId: groupId,
              userId: user?.id,
              menuItemId: item.id,
            }),
          }),
        );

        await Promise.all(groupPromises);

        // ✅ CRITICAL NEW FIX: Tell the backend to CLOSE the session immediately
        // This stops future items from merging into this order!
        if (groupId) {
          await fetch("/api/groups/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupOrderId: groupId,
              action: "SUBMIT_ORDER",
            }),
          });
        }

        clearCart();
        setShowSuccess(true); // Trigger success modal instead of instant redirect
      }
    } catch {
      alert("Error processing checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-zinc-300" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900">
          Your cart is empty
        </h2>
        <Link
          href="/member/restaurants"
          className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  const cartRegion =
    cartMetadata[(items[0] as any)?.restaurantId]?.region || user.country;
  const canPay = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
          Your Order
        </h1>
        <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-100 shadow-sm overflow-hidden">
          {items.map((item) => (
            <div
              key={item.uniqueId}
              className="p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{item.name}</h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Store className="w-3 h-3" />{" "}
                    {cartMetadata[(item as any).restaurantId]?.name ||
                      "Loading..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-bold text-zinc-900">
                  {formatPrice(item.price, cartRegion)}
                </span>
                <button
                  onClick={() => removeItem(item.uniqueId)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">
            Order Summary
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-bold">
                {formatPrice(total(), cartRegion)}
              </span>
            </div>
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-black text-lg">Total</span>
              <span className="font-black text-orange-600 text-2xl">
                {formatPrice(total(), cartRegion)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={isProcessing}
            className={`w-full py-4 font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${canPay ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Proceed for Approval"
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-black text-zinc-900 mb-3">
              Order Placed!
            </h3>
            <p className="text-zinc-500 font-medium mb-8 leading-relaxed">
              Your food request has been successfully submitted and is waiting
              for approval.
            </p>
            <button
              onClick={() => router.push("/member/orders")}
              className="w-full py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-orange-600 transition-colors shadow-lg"
            >
              Go to Orders Page
            </button>
          </div>
        </div>
      )}

      {/* DECISION MODAL */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl relative transition-all duration-300 ease-in-out">
            <button
              onClick={() => setShowDecisionModal(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {modalStep === "CHOICE" ? (
              <div className="p-10 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-black text-zinc-900 mb-2">
                  Order Type
                </h3>
                <p className="text-zinc-500 text-sm font-medium mb-8">
                  How would you like to process this order?
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => processOrder("PERSONAL")}
                    className="flex items-center gap-4 p-5 rounded-3xl border-2 border-zinc-100 hover:border-blue-600 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-900 block text-lg">
                        Personal Order
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">
                        Order just for yourself
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setModalStep("SELECT_GROUP")}
                    className="flex items-center gap-4 p-5 rounded-3xl border-2 border-zinc-100 hover:border-orange-600 hover:bg-orange-50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-900 block text-lg">
                        Team Group
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">
                        Add to a shared squad order
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setModalStep("CHOICE")}
                    className="p-2 -ml-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-zinc-600" />
                  </button>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">
                      Select Squad
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      Choose a group to add your items to
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {myGroups.length > 0 ? (
                    myGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => processOrder("GROUP", group.id)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-zinc-100 hover:border-orange-500 hover:bg-orange-50 transition-all group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            {group.hostId === user.id ? (
                              <Crown className="w-4 h-4 text-orange-600" />
                            ) : (
                              <Users className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              {group.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">
                              {group.hostId === user.id
                                ? "You are Host"
                                : `Host: ${group.host?.name}`}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-orange-500 transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                      <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-zinc-500">
                        No Active Squads
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Go to Group Orders to create one.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f4f4f5;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e4e4e7;
        }
      `}</style>
    </div>
  );
}
