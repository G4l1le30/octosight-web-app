"use client";

import { type ReactNode } from "react";
import { type UserRole } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";

interface RoleGuardProps {
  roles: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ roles, fallback = null, children }: RoleGuardProps) {
  const { isAdmin, hasRole } = usePermissions();

  if (isAdmin || roles.some((r) => hasRole(r))) return <>{children}</>;
  return <>{fallback}</>;
}
