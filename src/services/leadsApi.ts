import type { AddLeadRemarkPayload, AssignLeadPayload, BulkAssignLeadsPayload, CompleteLeadFollowUpPayload, CreateLeadFollowUpPayload, CreateLeadPayload, Lead, LeadActivity, LeadCallLog, LeadFollowUp, LeadListQuery, UpdateLeadStatusPayload } from "@/types/lead";
import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type { Pagination } from "@/types/global";

export interface LeadListData {
  leads: Lead[];
  pagination: Pagination;
}

export const leadsApi = {
  /**
   * GET /leads
   * List leads with pagination and filters.
   */
  list: async (
    query: LeadListQuery = {}
  ) => {
    const { data } = await apiClient.get<ApiEnvelope<LeadListData>>(
      "/leads",
      {
        params: query,
      }
    );
    return data.data;
  },

  /**
   * GET /leads/:id
   */
  getById: async (id: string): Promise<Lead> => {
    const { data } = await apiClient.get<ApiEnvelope<{ lead: Lead }>>(
      `/leads/${id}`
    );

    return data.data.lead;
  },

  /**
   * POST /leads
   */
  create: async (payload: CreateLeadPayload): Promise<Lead> => {
    const { data } = await apiClient.post<ApiEnvelope<{ lead: Lead }>>(
      "/leads",
      payload
    );

    return data.data.lead;
  },

  /**
   * PATCH /leads/:id/assign
   */
  assign: async (
    id: string,
    payload: AssignLeadPayload
  ): Promise<Lead> => {
    const { data } = await apiClient.patch<ApiEnvelope<{ lead: Lead }>>(
      `/leads/${id}/assign`,
      payload
    );

    return data.data.lead;
  },

  bulkAssign: async (payload: BulkAssignLeadsPayload) => {
    const { data } = await apiClient.patch<
      ApiEnvelope<{ assignedCount: number; leadIds?: string[] }>
    >("/leads/bulk-assign", payload);
    return data.data;
  },

  getCallLogs: async (id: string): Promise<LeadCallLog[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: LeadCallLog[] }>(
      `/leads/${id}/calls`
    );
    return data.data;
  },

  /**
   * PATCH /leads/:id/status
   */
  updateStatus: async (
    id: string,
    payload: UpdateLeadStatusPayload
  ): Promise<Lead> => {
    const { data } = await apiClient.patch<ApiEnvelope<{ lead: Lead }>>(
      `/leads/${id}/status`,
      payload
    );

    return data.data.lead;
  },

  /**
   * POST /leads/:id/remarks
   */
  addRemark: async (
    id: string,
    payload: AddLeadRemarkPayload
  ): Promise<Lead> => {
    const { data } = await apiClient.post<ApiEnvelope<{ lead: Lead }>>(
      `/leads/${id}/remarks`,
      payload
    );

    return data.data.lead;
  },

  /**
   * GET /leads/:id/activities
   */
  getActivities: async (id: string): Promise<LeadActivity[]> => {
    const { data } = await apiClient.get<
      ApiEnvelope<{ activities: LeadActivity[] }>
    >(`/leads/${id}/activities`);

    return data.data.activities;
  },

  /**
   * POST /leads/import
   *
   * Excel / CSV upload
   */
  import: async (
    file: File,
    branchId: string
  ) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("branchId", branchId);

    const { data } = await apiClient.post<
      ApiEnvelope<{
        totalRows: number;
        successful: number;
        duplicates: number;
        failed: number;
        errors: Array<{
          row: number;
          field?: string;
          value?: string;
          message: string;
        }>;
      }>
    >("/leads/import", formData);

    return data.data;
  },

  /**
   * POST /leads/:id/follow-ups
   */
  scheduleFollowUp: async (
    id: string,
    payload: CreateLeadFollowUpPayload
  ): Promise<LeadFollowUp> => {
    const { data } = await apiClient.post<
      ApiEnvelope<{ followUp: LeadFollowUp }>
    >(`/leads/${id}/follow-ups`, payload);

    return data.data.followUp;
  },

  /**
   * PATCH /leads/follow-ups/:followUpId/complete
   */
  completeFollowUp: async (
    followUpId: string,
    payload: CompleteLeadFollowUpPayload
  ): Promise<LeadFollowUp> => {
    const { data } = await apiClient.patch<
      ApiEnvelope<{ followUp: LeadFollowUp }>
    >(`/leads/follow-ups/${followUpId}/complete`, payload);

    return data.data.followUp;
  },

  /**
   * GET /leads/:id/follow-ups
   */
  getFollowUps: async (
    id: string
  ): Promise<LeadFollowUp[]> => {
    const { data } = await apiClient.get<
      ApiEnvelope<{ followUps: LeadFollowUp[] }>
    >(`/leads/${id}/follow-ups`);

    return data.data.followUps;
  },

  /**
   * GET /leads/my/follow-ups
   */
  getMyFollowUps: async (): Promise<LeadFollowUp[]> => {
    const { data } = await apiClient.get<
      ApiEnvelope<{ followUps: LeadFollowUp[] }>
    >("/leads/my/follow-ups");

    return data.data.followUps;
  },
};
