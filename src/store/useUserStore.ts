import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "slooze-storage",
    },
  ),
);
