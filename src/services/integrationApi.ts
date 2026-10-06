import { apiClient } from "./apiClient";
import type { ApiEnvelope, PaginatedApiEnvelope } from "./apiEnvelope";
import type { Pagination } from "@/types/employee";
import type {
  AppNotification,
  CreateIntegrationPayload,
  Integration,
  IntegrationCredentials,
  IntegrationEvent,
  IntegrationEventOutcome,
  LeadConversation,
  LeadMessage,
  ProviderInfo,
  SendLeadMessagePayload,
  UpdateIntegrationPayload,
  WhatsAppTemplate,
} from "@/types/integration";

export const integrationApi = {
  providers: async () => {
    const { data } = await apiClient.get<ApiEnvelope<ProviderInfo[]>>("/integrations/providers");
    return data.data;
  },

  test: async (provider: string, credentials: IntegrationCredentials) => {
    const { data } = await apiClient.post<
      ApiEnvelope<{ ok: boolean; account: string | null; error: string | null }>
    >("/integrations/test", { provider, credentials });
    return data.data;
  },

  list: async () => {
    const { data } = await apiClient.get<ApiEnvelope<Integration[]>>("/integrations");
    return data.data;
  },

  get: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<Integration>>(`/integrations/${id}`);
    return data.data;
  },

  create: async (payload: CreateIntegrationPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<Integration>>("/integrations", payload);
    return data;
  },

  update: async (id: string, payload: UpdateIntegrationPayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<Integration>>(`/integrations/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<null>>(`/integrations/${id}`);
    return data;
  },

  pause: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<Integration>>(`/integrations/${id}/pause`);
    return data;
  },

  resume: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<Integration>>(`/integrations/${id}/resume`);
    return data;
  },

  rotateWebhook: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<Integration>>(`/integrations/${id}/rotate-webhook`);
    return data;
  },

  importContacts: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<{ started: boolean }>>(
      `/integrations/${id}/import-contacts`
    );
    return data;
  },

  events: async (id: string, query: { outcome?: IntegrationEventOutcome; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<IntegrationEvent>>(
      `/integrations/${id}/events`,
      { params: query }
    );
    return { events: data.data, pagination: data.pagination as Pagination };
  },

  retryEvent: async (id: string, eventId: string) => {
    const { data } = await apiClient.post<ApiEnvelope<IntegrationEvent>>(
      `/integrations/${id}/events/${eventId}/retry`
    );
    return data;
  },
};

export const leadMessageApi = {
  list: async (leadId: string) => {
    const { data } = await apiClient.get<ApiEnvelope<LeadConversation>>(`/leads/${leadId}/messages`);
    return data.data;
  },

  templates: async (leadId: string) => {
    const { data } = await apiClient.get<ApiEnvelope<WhatsAppTemplate[]>>(
      `/leads/${leadId}/messages/templates`
    );
    return data.data;
  },

  send: async (leadId: string, payload: SendLeadMessagePayload) => {
    const { data } = await apiClient.post<ApiEnvelope<LeadMessage>>(`/leads/${leadId}/messages`, payload);
    return data;
  },
};

export const notificationApi = {
  list: async (query: { unreadOnly?: boolean; page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get<PaginatedApiEnvelope<AppNotification> & { unread: number }>(
      "/notifications",
      { params: query }
    );
    return { notifications: data.data, unread: data.unread, pagination: data.pagination as Pagination };
  },

  unreadCount: async () => {
    const { data } = await apiClient.get<ApiEnvelope<{ unread: number }>>("/notifications/unread-count");
    return data.data.unread;
  },

  markRead: async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await apiClient.patch("/notifications/read-all");
  },
};
