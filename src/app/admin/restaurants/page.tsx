"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Globe2,
  MapPin,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

export default function AdminRestaurants() {
  // 1. Removed Mock Data - Now using real database state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isAddRestaurantModalOpen, setAddRestaurantModalOpen] = useState(false);
  const [activeRestaurantForMenu, setActiveRestaurantForMenu] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any | null
  >(null);

  // Form States
  const [newResName, setNewResName] = useState("");
  const [newResRegion, setNewResRegion] = useState<"USA" | "INDIA">("USA");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  // 2. Fetch Real Vendors from Database
  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRestaurants();
  }, []);

  // Filter logic
  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 3. HANDLER: Add New Vendor to Database
  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName) return;

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newResName, region: newResRegion }),
      });

      if (res.ok) {
        setAddRestaurantModalOpen(false);
        setNewResName("");
        fetchRestaurants(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to add restaurant:", error);
    }
  };

  // 4. HANDLER: Add Menu Item to Database
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !activeRestaurantForMenu ||
      !newItemName ||
      !newItemPrice ||
      !newItemCategory
    )
      return;

    try {
      // Calls the same API, but we specify the item creation
      const res = await fetch("/api/vendors/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: activeRestaurantForMenu.id,
          name: newItemName,
          category: newItemCategory,
          price: parseFloat(newItemPrice),
        }),
      });

      if (res.ok) {
        setNewItemName("");
        setNewItemCategory("");
        setNewItemPrice("");
        setActiveRestaurantForMenu(null);
        fetchRestaurants(); // Refresh to show new menu count
      }
    } catch (error) {
      console.error("Failed to add menu item:", error);
    }
  };

  // 5. HANDLER: Delete Vendor from Database
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This will permanently remove this vendor.")) {
      try {
        const res = await fetch(`/api/vendors?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchRestaurants(); // Refresh the list
        }
      } catch (error) {
        console.error("Failed to delete restaurant:", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Vendor Management
          </h1>
          <p className="text-zinc-500 mt-2">
            Manage restaurant partnerships and menus across all regions.
          </p>
        </div>
        <button
          onClick={() => setAddRestaurantModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-zinc-200"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search live restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-white shadow-sm"
        />
      </div>

      {/* RESTAURANT GRID */}
      {restaurants.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 font-medium">
          No vendors found. Click &quot;Add Vendor&quot; to create your first
          restaurant.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="group bg-white rounded-3xl border border-zinc-100 p-6 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider ${
                  restaurant.region === "USA"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                {restaurant.region === "USA" ? "USA" : "IND"}
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl font-black text-zinc-400 uppercase">
                  {restaurant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg leading-tight">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mt-1">
                    {restaurant.region === "USA" ? (
                      <Globe2 size={12} />
                    ) : (
                      <Building2 size={12} />
                    )}
                    {restaurant.region} Region
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-zinc-500 font-medium flex items-center gap-2">
                    <UtensilsCrossed size={14} /> Menu Items
                  </span>
                  <span className="font-bold text-zinc-900">
                    {restaurant.menu?.length || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-zinc-500 font-medium flex items-center gap-2">
                    <MapPin size={14} /> Service Fee
                  </span>
                  <span className="font-bold text-zinc-900">15%</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 flex gap-2">
                <button
                  onClick={() => setActiveRestaurantForMenu(restaurant)}
                  className="flex-1 py-2 bg-zinc-900 text-white font-bold text-xs rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Add Food Item
                </button>
                <button
                  onClick={() => handleDelete(restaurant.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD RESTAURANT */}
      {isAddRestaurantModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-900">
                New Restaurant
              </h2>
              <button
                onClick={() => setAddRestaurantModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={newResName}
                  onChange={(e) => setNewResName(e.target.value)}
                  className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  placeholder="e.g. Burger King"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Region
                </label>
                <select
                  value={newResRegion}
                  onChange={(e) =>
                    setNewResRegion(e.target.value as "USA" | "INDIA")
                  }
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

      {/* MODAL: ADD MENU ITEM */}
      {activeRestaurantForMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-zinc-900">
                  Add Menu Item
                </h2>
                <p className="text-xs font-medium text-zinc-500">
                  For {activeRestaurantForMenu.name}
                </p>
              </div>
              <button
                onClick={() => setActiveRestaurantForMenu(null)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  placeholder="e.g. Spicy Chicken Taco"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                    placeholder="e.g. Mains"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Price (
                    {activeRestaurantForMenu.region === "INDIA" ? "₹" : "$"})
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors mt-4"
              >
                Add to Menu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
