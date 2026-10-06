import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import type {
  LateCheckInItem,
  ReviewLateCheckInPayload,
} from "../types/lateCheckIn";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Fetch late check-in requests
export const useLateCheckInRequests = (status?: string) => {
  return useQuery({
    queryKey: ["late-checkins", status],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiEnvelope<LateCheckInItem[]>>(
        "/late-checkin",
        {
          params: status ? { status: status.toLowerCase() } : {},
        },
      );
      return data.data;
    },
  });
};

// Fetch pending count specifically for badge indicator
export const usePendingLateCheckInCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["late-checkins", "pending-count"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiEnvelope<LateCheckInItem[]>>(
        "/late-checkin",
        { params: { status: "PENDING" } },
      );
      return data.data.length;
    },
    enabled,
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });
};

// Review request mutation (Approve / Reject)
export const useReviewLateCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      remarks,
    }: ReviewLateCheckInPayload) => {
      const { data } = await apiClient.patch<ApiEnvelope<LateCheckInItem>>(
        `/late-checkin/${requestId}/review`,
        { status, remarks },
      );
      return data.data;
    },
    onSuccess: () => {
      // Invalidate queries so lists and badge counts re-fetch automatically
      queryClient.invalidateQueries({ queryKey: ["late-checkins"] });
    },
  });
};
