import { Navigate, Outlet } from "react-router";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/types/auth";

interface PermissionRouteProps {
  permission: Permission | Permission[];
  mode?: "any" | "all";
}

const PermissionRoute = ({ permission, mode = "any" }: PermissionRouteProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-2xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  const allowed = Array.isArray(permission)
    ? mode === "all"
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
    // or route to a dedicated /403 page — see note below
  }

  return <Outlet />;
};

export default PermissionRoute;