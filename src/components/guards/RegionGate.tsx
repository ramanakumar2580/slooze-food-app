"use client";

import React from "react";
import { useUserStore } from "@/store/useUserStore";

interface RegionGateProps {
  children: React.ReactNode;
  country: "INDIA" | "USA";
}

export const RegionGate = ({ children, country }: RegionGateProps) => {
  const { user } = useUserStore();

  if (!user) return null;
  if (user.role === "ADMIN") {
    return <>{children}</>;
  }
  if (user.country !== country) {
    return null;
  }

  return <>{children}</>;
};
