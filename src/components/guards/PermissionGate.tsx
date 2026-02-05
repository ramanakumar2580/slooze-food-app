"use client";

import React from "react";
import { useUserStore } from "@/store/useUserStore";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

interface PermissionGateProps {
  children: React.ReactNode;
  action: keyof typeof PERMISSIONS;
}

export const PermissionGate = ({ children, action }: PermissionGateProps) => {
  const { user } = useUserStore();

  if (!user) return null;

  if (!hasPermission(user.role, action)) {
    return null;
  }

  return <>{children}</>;
};
