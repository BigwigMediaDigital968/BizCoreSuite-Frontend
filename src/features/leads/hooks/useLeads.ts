import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
    leadsApi,
} from "@/services/leadsApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
    AddLeadRemarkPayload,
    AssignLeadPayload,
    BulkAssignLeadsPayload,
    CompleteLeadFollowUpPayload,
    CreateLeadFollowUpPayload,
    CreateLeadPayload,
    LeadListQuery,
    UpdateLeadStatusPayload
} from "@/types/lead";

/* =========================================================
   Query Keys
========================================================= */

export const leadQueryKeys = {
    all: ["leads"] as const,

    lists: () => [...leadQueryKeys.all, "list"] as const,

    list: (query: LeadListQuery) =>
        [...leadQueryKeys.lists(), query] as const,

    details: () => [...leadQueryKeys.all, "detail"] as const,

    detail: (id: string) =>
        [...leadQueryKeys.details(), id] as const,

    activities: (id: string) =>
        [...leadQueryKeys.detail(id), "activities"] as const,

    followUps: (id: string) =>
        [...leadQueryKeys.detail(id), "follow-ups"] as const,

    myFollowUps: () =>
        [...leadQueryKeys.all, "my-follow-ups"] as const,

    callLogs: (id: string) =>
        [...leadQueryKeys.detail(id), "calls"] as const,
};


/* =========================================================
   LEADS LIST
   GET /leads
========================================================= */

export const useLeads = (query: LeadListQuery = {}) => {
    return useQuery({
        queryKey: leadQueryKeys.list(query),
        queryFn: () => leadsApi.list(query),
    });
};


/* =========================================================
   SINGLE LEAD
   GET /leads/:id
========================================================= */

export const useLead = (id?: string) => {
    return useQuery({
        queryKey: leadQueryKeys.detail(id ?? ""),

        queryFn: () => leadsApi.getById(id!),

        enabled: Boolean(id),
    });
};


/* =========================================================
   CREATE LEAD
   POST /leads
========================================================= */

export const useCreateLead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateLeadPayload) =>
            leadsApi.create(payload),

        onSuccess: () => {
            toast.success("Lead created successfully");
            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.lists(),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to create lead"));
        },
    });
};


/* =========================================================
   ASSIGN LEAD
   PATCH /leads/:id/assign
========================================================= */

export const useAssignLead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: AssignLeadPayload;
        }) => leadsApi.assign(id, payload),

        onSuccess: (lead) => {
            toast.success("Lead assigned successfully");

            // Update current lead cache immediately
            queryClient.setQueryData(
                leadQueryKeys.detail(lead._id),
                lead
            );

            // Refresh lists because assignedTo changed
            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.lists(),
            });

            // Activities may also have changed
            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.activities(lead._id),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to assign lead"));
        },
    });
};


export const useBulkAssignLeads = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: BulkAssignLeadsPayload) => leadsApi.bulkAssign(payload),
        onSuccess: (result) => {
            toast.success(`${result.assignedCount} leads assigned successfully`);
            queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to assign leads"));
        },
    });
};

/* =========================================================
   UPDATE STATUS
   PATCH /leads/:id/status
========================================================= */

export const useUpdateLeadStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateLeadStatusPayload;
        }) => leadsApi.updateStatus(id, payload),

        onSuccess: (lead) => {
            toast.success("Lead status updated");

            queryClient.setQueryData(
                leadQueryKeys.detail(lead._id),
                lead
            );

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.activities(lead._id),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to update lead status"));
        },
    });
};


/* =========================================================
   ADD REMARK
   POST /leads/:id/remarks
========================================================= */

export const useAddLeadRemark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: AddLeadRemarkPayload;
        }) => leadsApi.addRemark(id, payload),

        onSuccess: (lead) => {
            toast.success("Remark added");

            queryClient.setQueryData(
                leadQueryKeys.detail(lead._id),
                lead
            );

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.activities(lead._id),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to add remark"));
        },
    });
};


/* =========================================================
   LEAD ACTIVITIES
   GET /leads/:id/activities
========================================================= */

export const useLeadActivities = (id?: string) => {
    return useQuery({
        queryKey: leadQueryKeys.activities(id ?? ""),

        queryFn: () => leadsApi.getActivities(id!),

        enabled: Boolean(id),
    });
};


export const useLeadCallLogs = (id?: string) => {
    return useQuery({
        queryKey: leadQueryKeys.callLogs(id ?? ""),
        queryFn: () => leadsApi.getCallLogs(id!),
        enabled: Boolean(id),
    });
};

/* =========================================================
   IMPORT LEADS
   POST /leads/import
========================================================= */

export const useImportLeads = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            file,
            branchId,
        }: {
            file: File;
            branchId: string;
        }) => leadsApi.import(file, branchId),

        onSuccess: (result) => {
            toast.success(
                `Import completed: ${result.successful} added, ${result.duplicates} duplicates, ${result.failed} failed`
            );

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.lists(),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to import leads"));
        },
    });
};


/* =========================================================
   SCHEDULE FOLLOW-UP
   POST /leads/:id/follow-ups
========================================================= */

export const useScheduleFollowUp = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: CreateLeadFollowUpPayload;
        }) => leadsApi.scheduleFollowUp(id, payload),

        onSuccess: (_, variables) => {
            toast.success("Follow-up scheduled");

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.followUps(variables.id),
            });

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.myFollowUps(),
            });

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.activities(variables.id),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to schedule follow-up"));
        },
    });
};


/* =========================================================
   COMPLETE FOLLOW-UP
   PATCH /leads/follow-ups/:followUpId/complete
========================================================= */

export const useCompleteFollowUp = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            followUpId,
            payload,
        }: {
            followUpId: string;
            payload: CompleteLeadFollowUpPayload;
        }) => leadsApi.completeFollowUp(followUpId, payload),

        onSuccess: (followUp) => {
            toast.success("Follow-up marked complete");

            const leadId =
                typeof followUp.lead === "string"
                    ? followUp.lead
                    : followUp.lead._id;

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.followUps(leadId),
            });

            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.myFollowUps(),
            });

            // Activity is created when follow-up is completed.
            queryClient.invalidateQueries({
                queryKey: leadQueryKeys.activities(leadId),
            });
        },

        onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to complete follow-up"));
        },
    });
};


/* =========================================================
   FOLLOW-UPS FOR LEAD
   GET /leads/:id/follow-ups
========================================================= */

export const useLeadFollowUps = (id?: string) => {
    return useQuery({
        queryKey: leadQueryKeys.followUps(id ?? ""),

        queryFn: () => leadsApi.getFollowUps(id!),

        enabled: Boolean(id),
    });
};


/* =========================================================
   MY FOLLOW-UPS
   GET /leads/my/follow-ups
========================================================= */

export const useMyFollowUps = () => {
    return useQuery({
        queryKey: leadQueryKeys.myFollowUps(),

        queryFn: () => leadsApi.getMyFollowUps(),
    });
};
