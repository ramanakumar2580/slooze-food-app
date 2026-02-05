export const PERMISSIONS = {
  VIEW_RESTAURANTS: "VIEW_RESTAURANTS",
  CREATE_ORDER: "CREATE_ORDER",
  PLACE_ORDER: "PLACE_ORDER",
  CANCEL_ORDER: "CANCEL_ORDER",
  UPDATE_PAYMENT: "UPDATE_PAYMENT",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type Role = "ADMIN" | "MANAGER" | "MEMBER";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "VIEW_RESTAURANTS",
    "CREATE_ORDER",
    "PLACE_ORDER",
    "CANCEL_ORDER",
    "UPDATE_PAYMENT",
  ],
  MANAGER: ["VIEW_RESTAURANTS", "CREATE_ORDER", "PLACE_ORDER", "CANCEL_ORDER"],
  MEMBER: ["VIEW_RESTAURANTS", "CREATE_ORDER"],
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  const allowedPermissions = ROLE_PERMISSIONS[role];
  return allowedPermissions.includes(permission);
};
