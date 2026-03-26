import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MenuItem } from "@/types";

export interface CartItem extends MenuItem {
  uniqueId: string;
  restaurantId: string;
}

interface CartState {
  items: CartItem[];

  // Updated to return an object so the UI knows if it was blocked
  addItem: (item: MenuItem & { restaurantId: string }) => {
    success: boolean;
    requiresConfirmation: boolean;
  };

  // New function to handle the cart swap
  replaceCartAndAdd: (item: MenuItem & { restaurantId: string }) => void;

  removeItem: (uniqueId: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const currentItems = get().items;

        // THE FEATURE: Check if the cart has food from a DIFFERENT restaurant
        if (
          currentItems.length > 0 &&
          currentItems[0].restaurantId !== item.restaurantId
        ) {
          // Block the addition and tell the UI to show a warning modal
          return { success: false, requiresConfirmation: true };
        }

        // If it's the same restaurant (or an empty cart), add it normally
        const newItem = {
          ...item,
          uniqueId: Math.random().toString(36).substr(2, 9),
        };

        set((state) => ({ items: [...state.items, newItem] }));

        return { success: true, requiresConfirmation: false };
      },

      replaceCartAndAdd: (item) => {
        const newItem = {
          ...item,
          uniqueId: Math.random().toString(36).substr(2, 9),
        };
        // This instantly clears the old array and starts a new one with this item
        set({ items: [newItem] });
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
