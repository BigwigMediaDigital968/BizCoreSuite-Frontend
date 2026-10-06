import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/types/auth";

interface CanProps {
  permission: Permission | Permission[];
  mode?: "any" | "all"; // only relevant when permission is an array
  fallback?: ReactNode;
  children: ReactNode;
}

export const Can = ({
  permission,
  mode = "any",
  fallback = null,
  children,
}: CanProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  if (isLoading) return null; // avoid flash of content before perms load

  const allowed = Array.isArray(permission)
    ? mode === "all"
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  return allowed ? <>{children}</> : <>{fallback}</>;
};