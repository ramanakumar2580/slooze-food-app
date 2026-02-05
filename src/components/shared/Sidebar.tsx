"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  LogOut,
  MapPin,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  LayoutDashboard,
  Globe2,
  Clock,
  Store,
  ListOrdered,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useUserStore();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const adminLinks = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Global Orders", href: "/admin/orders", icon: BarChart3 },
    { name: "Vendor Mgmt", href: "/admin/restaurants", icon: Store },
    { name: "Billing", href: "/admin/payments", icon: CreditCard },
    { name: "Employees", href: "/admin/users", icon: Users },
  ];

  const managerLinks = [
    { name: "Overview", href: "/manager/dashboard", icon: LayoutDashboard },
    { name: "Team Orders", href: "/manager/orders", icon: ListOrdered },
    { name: "Restaurant Control", href: "/manager/restaurants", icon: Store },
    { name: "My Region", href: "/manager/region", icon: MapPin },
  ];

  const diningLinks = [
    ...(user.role === "MEMBER"
      ? [
          {
            name: "My Dashboard",
            href: "/member/dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),
    { name: "Order Food", href: "/member/restaurants", icon: UtensilsCrossed },
    { name: "My Cart", href: "/member/cart", icon: ShoppingBag },
    { name: "My Orders", href: "/member/orders", icon: Clock },
  ];
  let managementLinks: typeof adminLinks = [];
  if (user.role === "ADMIN") managementLinks = adminLinks;
  if (user.role === "MANAGER") managementLinks = managerLinks;

  return (
    <aside className="w-64 bg-zinc-900 text-white border-r border-zinc-800 h-screen flex flex-col z-40 shrink-0 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <span className="font-black text-xl tracking-tighter italic text-orange-500">
          Slooze
        </span>
        <span className="ml-2 text-[10px] font-bold bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-wider">
          {user.role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {user.role !== "MEMBER" && (
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">
              Management
            </div>
            <div className="space-y-1">
              {managementLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-zinc-500 group-hover:text-white"
                      }`}
                    />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">
            Lunch & Dining
          </div>
          <div className="space-y-1">
            {diningLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-zinc-500 group-hover:text-white"
                    }`}
                  />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3 mb-4 px-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-800">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-inner ${
              user.role === "ADMIN"
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : user.role === "MANAGER"
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600"
            }`}
          >
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
              <Globe2 className="w-3 h-3" />
              {user.country}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-lg transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
