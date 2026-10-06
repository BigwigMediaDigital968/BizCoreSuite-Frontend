import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { authApi } from "@/services/authApi";
import { lateCheckInApi } from "@/services/authApi";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { LoginPayload } from "@/types/auth";

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  return {
    user,
    isAuthenticated: !!accessToken && !!user,
    isBootstrapping,
  };
};

export const useLogin = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      navigate("/dashboard", { replace: true });
    },
  });
};

export const useUpdateProfile = () => {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (payload: { name: string }) => authApi.updateMe(payload),
    onSuccess: (user) => {
      updateUser(user);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to change password"));
    },
  });
};

/** Head/Admin resetting someone else's password from their profile page. */
export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => authApi.resetUserPassword(userId, { newPassword }),
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update password"));
    },
  });
};

export const useSubmitLateReason = () => {
  return useMutation({
    mutationFn: (payload: { lockoutToken: string; reason: string }) =>
      lateCheckInApi.submitReason(payload),
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    },
    onSettled: () => {
      useAuthStore.getState().clearSession();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
};
