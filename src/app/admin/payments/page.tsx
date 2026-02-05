"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MapPin,
  Globe2,
  Trash2,
  Power,
  Earth,
  UtensilsCrossed,
  X,
} from "lucide-react";

export default function AdminRestaurants() {
  // 1. Admin Region Toggle
  const [adminRegion, setAdminRegion] = useState<"ALL" | "USA" | "INDIA">(
    "ALL",
  );

  // 2. Data State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 3. Modal State
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRegion, setNewRegion] = useState("USA");

  // 4. Fetch Restaurants
  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        setRestaurants(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRestaurants();
  }, []);

  // 5. HANDLER: Add Restaurant
  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, region: newRegion }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setNewName("");
        fetchRestaurants();
      }
    } catch (error) {
      console.error("Failed to add restaurant:", error);
    }
  };

  // 6. HANDLER: Delete Restaurant
  const handleDelete = async (id: string) => {
    if (
      confirm("Are you sure? This will delete the restaurant and its menu.")
    ) {
      try {
        const res = await fetch(`/api/vendors?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchRestaurants();
      } catch (error) {
        console.error("Failed to delete:", error);
      }
    }
  };

  // Filter Logic
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesRegion = adminRegion === "ALL" || r.region === adminRegion;
    const matchesSearch = r.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Vendor Management
          </h1>
          <p className="text-zinc-500 mt-2">
            Manage active food vendors for each region.
          </p>
        </div>

        {/* REGION TOGGLES */}
        <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl text-white shadow-lg">
          <div className="flex bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setAdminRegion("ALL")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminRegion === "ALL" ? "bg-white text-zinc-900" : "text-zinc-400"}`}
            >
              <Earth className="w-3 h-3" /> Global
            </button>
            <button
              onClick={() => setAdminRegion("USA")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminRegion === "USA" ? "bg-white text-zinc-900" : "text-zinc-400"}`}
            >
              <Globe2 className="w-3 h-3" /> USA
            </button>
            <button
              onClick={() => setAdminRegion("INDIA")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${adminRegion === "INDIA" ? "bg-white text-zinc-900" : "text-zinc-400"}`}
            >
              <MapPin className="w-3 h-3" /> IND
            </button>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-zinc-50/50"
          />
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* RESTAURANT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="group bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-xl uppercase">
                {restaurant.name.charAt(0)}
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 text-zinc-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Toggle Active"
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(restaurant.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-zinc-900">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                {restaurant.region === "USA" ? (
                  <Globe2 className="w-3 h-3" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                {restaurant.region}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                <UtensilsCrossed className="w-3 h-3" />
                {restaurant.menu?.length || 0} Items
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-900">
                Add New Vendor
              </h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRestaurant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  placeholder="e.g. Burger King"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Region
                </label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
                >
                  <option value="USA">USA</option>
                  <option value="INDIA">INDIA</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors mt-4"
              >
                Create Vendor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
