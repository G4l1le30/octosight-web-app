"use client";

import { useAuth } from "@/lib/auth-context";
import {
  type UserRole,
  ROLE_HIERARCHY,
  ROLE_DEFAULT_PERMISSIONS,
} from "@/types/auth";

export function usePermissions() {
  const { user } = useAuth();

  const effectivePermissions = (): string[] => {
    if (!user) return [];
    if (user.permissions) return user.permissions;
    return ROLE_DEFAULT_PERMISSIONS[user.role] ?? [];
  };

  const perms = effectivePermissions();
  const isAdmin = user?.role === "admin" || perms.includes("*");

  return {
    can: (permission: string) => {
      if (isAdmin) return true;
      return perms.includes(permission);
    },
    canAny: (permissions: string[]) => {
      if (isAdmin) return true;
      return permissions.some((p) => perms.includes(p));
    },
    canAll: (permissions: string[]) => {
      if (isAdmin) return true;
      return permissions.every((p) => perms.includes(p));
    },
    hasRole: (role: UserRole) => user?.role === role,
    roleLevel: user ? ROLE_HIERARCHY[user.role] ?? -99 : -99,
    isAtLeast: (role: UserRole) => {
      if (!user) return false;
      const userLevel = ROLE_HIERARCHY[user.role] ?? -99;
      const requiredLevel = ROLE_HIERARCHY[role] ?? -99;
      return userLevel >= requiredLevel;
    },
    isAdmin,
    role: user?.role as UserRole | undefined,
  };
}
