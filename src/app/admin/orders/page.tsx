"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Download,
  Globe2,
  Search,
  MapPin,
  DollarSign,
  IndianRupee,
  Earth,
  Users, // Added icon for squad badge
} from "lucide-react";

const USD_TO_INR = 83;

export default function AdminOrders() {
  const [adminRegion, setAdminRegion] = useState<"ALL" | "USA" | "INDIA">(
    "ALL",
  );
  const [adminCurrency, setAdminCurrency] = useState<"USD" | "INR">("USD");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    const fetchGlobalOrders = async () => {
      try {
        const res = await fetch("/api/orders?view=GLOBAL&role=ADMIN");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Failed to fetch global orders:", error);
      }
    };
    fetchGlobalOrders();
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const getConvertedPrice = (originalAmount: number, itemRegion: string) => {
    if (itemRegion === "INDIA" && adminCurrency === "USD")
      return originalAmount / USD_TO_INR;
    if (itemRegion === "USA" && adminCurrency === "INR")
      return originalAmount * USD_TO_INR;
    return originalAmount;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDisplayStatus = (order: any) => {
    if (order.status === "PREPARING") {
      const orderTime = new Date(order.createdAt).getTime();
      // eslint-disable-next-line react-hooks/purity
      const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
      if (orderTime < thirtyMinsAgo) return "DELIVERED";
    }
    return order.status;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesRegion =
      adminRegion === "ALL" || order.restaurant?.region === adminRegion;
    const matchesSearch =
      order.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const totalVolume = filteredOrders.reduce((sum, order) => {
    return sum + getConvertedPrice(order.totalAmount, order.restaurant?.region);
  }, 0);

  return (
    <div className="flex flex-col space-y-4 p-4 bg-zinc-50 max-h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Global Order History
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Viewing{" "}
            <span className="font-bold text-zinc-900">
              {filteredOrders.length}
            </span>{" "}
            orders.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl text-white shadow-lg shrink-0">
          <div className="flex bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setAdminRegion("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminRegion === "ALL" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"}`}
            >
              <Earth className="w-3 h-3 mr-1 inline" /> Global
            </button>
            <button
              onClick={() => setAdminRegion("USA")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminRegion === "USA" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"}`}
            >
              <Globe2 className="w-3 h-3 mr-1 inline" /> USA
            </button>
            <button
              onClick={() => setAdminRegion("INDIA")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminRegion === "INDIA" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"}`}
            >
              <MapPin className="w-3 h-3 mr-1 inline" /> IND
            </button>
          </div>
          <div className="w-px h-6 bg-zinc-700" />
          <div className="flex bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setAdminCurrency("USD")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminCurrency === "USD" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              <DollarSign className="w-3 h-3" />
            </button>
            <button
              onClick={() => setAdminCurrency("INR")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminCurrency === "INR" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              <IndianRupee className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 text-sm focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-zinc-50 border border-zinc-100 px-4 py-2 rounded-xl text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                Total Volume
              </p>
              <p className="text-xl font-black text-zinc-900 mt-1 leading-none">
                {new Intl.NumberFormat(
                  adminCurrency === "INR" ? "en-IN" : "en-US",
                  { style: "currency", currency: adminCurrency },
                ).format(totalVolume)}
              </p>
            </div>
            <button className="h-12 w-12 flex items-center justify-center bg-zinc-900 text-white rounded-xl shadow-md hover:bg-zinc-800 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[512px] relative scrollbar-thin scrollbar-thumb-zinc-200">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-white h-[64px]">
                {[
                  "Order ID",
                  "Region",
                  "Employee",
                  "Details",
                  `Amount`,
                  "Status",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 font-bold text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100 bg-white"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const convertedAmount = getConvertedPrice(
                    order.totalAmount,
                    order.restaurant?.region,
                  );
                  const displayStatus = getDisplayStatus(order);
                  return (
                    <tr
                      key={order.id}
                      className="group hover:bg-zinc-50/50 transition-colors h-[64px]"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-500">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded border uppercase ${order.restaurant?.region === "USA" ? "text-blue-700 bg-blue-50 border-blue-100" : "text-orange-700 bg-orange-50 border-orange-100"}`}
                        >
                          {order.restaurant?.region === "USA" ? (
                            <Globe2 className="w-2.5 h-2.5 mr-1" />
                          ) : (
                            <Building2 className="w-2.5 h-2.5 mr-1" />
                          )}{" "}
                          {order.restaurant?.region}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900">
                          {order.user?.name}
                        </div>
                        {/* ✅ GROUP ORDER BADGE VISIBLE HERE */}
                        {order.isGroupOrder && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-blue-100">
                              <Users className="w-3 h-3" />
                              {order.groupOrder?.name || "SQUAD"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 leading-tight">
                        <p className="font-semibold text-zinc-800 truncate max-w-[150px]">
                          {order.restaurant?.name}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-black text-zinc-900">
                        {new Intl.NumberFormat(
                          adminCurrency === "INR" ? "en-IN" : "en-US",
                          { style: "currency", currency: adminCurrency },
                        ).format(convertedAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${displayStatus === "DELIVERED" ? "text-green-600 bg-green-50 border border-green-100" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-zinc-400">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
