import { useQuery } from "@tanstack/react-query";
import { permissionApi } from "@/services/permissionApi";
import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@/types/auth";

export const useRolePermissionsMap = () => {
  const isAuthenticated = useAuthStore(
    (s) => !!s.accessToken
  );

  return useQuery({
    queryKey: ["permissions"],
    queryFn: permissionApi.getAll,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
};

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);

  const {
    data: rolePermissionsMap,
    isLoading,
    isError,
  } = useRolePermissionsMap();

  const permissions: Permission[] =
    user && rolePermissionsMap
      ? rolePermissionsMap[user.role] ?? []
      : [];

  const permissionSet = new Set(permissions);

  const hasPermission = (permission: Permission) => {
    return permissionSet.has(permission);
  };

  const hasAnyPermission = (required: Permission[]) => {
    return required.some((permission) =>
      permissionSet.has(permission)
    );
  };

  const hasAllPermissions = (required: Permission[]) => {
    return required.every((permission) =>
      permissionSet.has(permission)
    );
  };

  return {
    permissions,
    isLoading,
    isError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};