"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore"; // Import Cart Store
import { LogOut, User, ShoppingCart } from "lucide-react"; // Added ShoppingCart

export const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUserStore();
  const { items } = useCartStore(); // Get items from cart

  const isLanding = pathname === "/";
  const isLogin = pathname === "/login";

  if (isLogin) return null;

  return (
    <nav
      className={`z-50 h-16 flex items-center justify-between px-8 transition-all ${
        isLanding
          ? "fixed top-0 right-0 left-0 bg-white/80 backdrop-blur-md border-b border-slate-200"
          : "sticky top-0 w-full bg-white border-b border-slate-200"
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl font-black tracking-tighter text-orange-600 italic">
          SLOOZE
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {isLanding || !user ? (
          <Link
            href="/login"
            className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-slate-200"
          >
            Login
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            {/* Cart Button with Real Count */}
            <Link
              href="/member/cart"
              className="relative p-2.5 mr-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in">
                  {items.length}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <User size={14} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-900 leading-none">
                  {user.name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {user.role}
                </p>
              </div>
            </div>
            <Link
              href="/login"
              onClick={() => useUserStore.getState().logout()}
              className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
