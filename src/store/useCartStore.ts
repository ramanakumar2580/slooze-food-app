import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MenuItem } from "@/types";

export interface CartItem extends MenuItem {
  uniqueId: string;
  restaurantId: string;
}

interface CartState {
  items: CartItem[];

  addItem: (item: MenuItem & { restaurantId: string }) => void;
  removeItem: (uniqueId: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem = {
          ...item,
          uniqueId: Math.random().toString(36).substr(2, 9),
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (uniqueId) => {
        set((state) => ({
          items: state.items.filter((i) => i.uniqueId !== uniqueId),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () => {
        return get().items.reduce((sum, item) => sum + item.price, 0);
      },
    }),
    {
      name: "slooze-cart",
    },
  ),
);
