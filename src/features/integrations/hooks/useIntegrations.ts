import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { integrationApi, leadMessageApi, notificationApi } from "@/services/integrationApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
  CreateIntegrationPayload,
  IntegrationEventOutcome,
  SendLeadMessagePayload,
  UpdateIntegrationPayload,
} from "@/types/integration";

export const integrationKeys = {
  all: ["integrations"] as const,
  providers: () => [...integrationKeys.all, "providers"] as const,
  list: () => [...integrationKeys.all, "list"] as const,
  detail: (id: string) => [...integrationKeys.all, "detail", id] as const,
  events: (id: string, outcome?: string, page?: number) =>
    [...integrationKeys.all, "events", id, outcome, page] as const,
  leadMessages: (leadId: string) => ["lead-messages", leadId] as const,
  leadTemplates: (leadId: string) => ["lead-messages", leadId, "templates"] as const,
  notifications: () => ["notifications"] as const,
};

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: integrationKeys.all });
};

// ---------- Integrations (Head) ----------

export const useProviders = () =>
  useQuery({ queryKey: integrationKeys.providers(), queryFn: integrationApi.providers, staleTime: 5 * 60_000 });

export const useIntegrations = () =>
  useQuery({ queryKey: integrationKeys.list(), queryFn: integrationApi.list });

/** Polls while a contact import runs, so the progress updates by itself. */
export const useIntegration = (id?: string) =>
  useQuery({
    queryKey: integrationKeys.detail(id ?? ""),
    queryFn: () => integrationApi.get(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.import?.status === "running" ? 3000 : 30_000),
  });

export const useIntegrationEvents = (id: string, outcome?: IntegrationEventOutcome, page = 1) =>
  useQuery({
    queryKey: integrationKeys.events(id, outcome, page),
    queryFn: () => integrationApi.events(id, { outcome, page, limit: 25 }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });

export const useTestIntegration = () =>
  useMutation({
    mutationFn: ({ provider, credentials }: { provider: string; credentials: CreateIntegrationPayload["credentials"] }) =>
      integrationApi.test(provider, credentials),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't test the connection")),
  });

export const useCreateIntegration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateIntegrationPayload) => integrationApi.create(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Integration connected");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't connect the integration")),
  });
};

export const useUpdateIntegration = (id: string) => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: UpdateIntegrationPayload) => integrationApi.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Integration updated");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the integration")),
  });
};

const useIntegrationAction = (
  action: (id: string) => Promise<{ message?: string }>,
  fallbackError: string
) => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: action,
    onSuccess: (response) => {
      if (response.message) toast.success(response.message);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, fallbackError)),
  });
};

export const usePauseIntegration = () => useIntegrationAction(integrationApi.pause, "Couldn't pause");
export const useResumeIntegration = () => useIntegrationAction(integrationApi.resume, "Couldn't resume");
export const useRotateWebhook = () => useIntegrationAction(integrationApi.rotateWebhook, "Couldn't regenerate the URL");
export const useDeleteIntegration = () => useIntegrationAction(integrationApi.remove, "Couldn't delete");
export const useImportContacts = () => useIntegrationAction(integrationApi.importContacts, "Couldn't start the import");

export const useRetryEvent = (integrationId: string) => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (eventId: string) => integrationApi.retryEvent(integrationId, eventId),
    onSuccess: (response) => {
      const outcome = response.data?.outcome;
      if (outcome === "failed") toast.error(response.data?.error ?? "The event failed again");
      else toast.success("Event processed");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't retry the event")),
  });
};

// ---------- WhatsApp on a lead ----------

/** Polled while the lead page is open (the frontend has no live socket). */
export const useLeadConversation = (leadId?: string) =>
  useQuery({
    queryKey: integrationKeys.leadMessages(leadId ?? ""),
    queryFn: () => leadMessageApi.list(leadId as string),
    enabled: Boolean(leadId),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

export const useLeadTemplates = (leadId: string, enabled: boolean) =>
  useQuery({
    queryKey: integrationKeys.leadTemplates(leadId),
    queryFn: () => leadMessageApi.templates(leadId),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });

export const useSendLeadMessage = (leadId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendLeadMessagePayload) => leadMessageApi.send(leadId, payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.leadMessages(leadId) });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't send the message")),
  });
};

// ---------- Notifications ----------

export const useNotifications = (open: boolean) =>
  useQuery({
    queryKey: integrationKeys.notifications(),
    queryFn: () => notificationApi.list({ limit: 20 }),
    // Poll the badge even while closed; the dropdown refetches on open.
    refetchInterval: open ? 15_000 : 30_000,
    refetchOnWindowFocus: true,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: integrationKeys.notifications() }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: integrationKeys.notifications() }),
  });
};
