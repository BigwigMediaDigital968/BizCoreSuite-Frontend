import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type {
    Contest,
    ContestListData,
    ContestListQuery,
    CreateContestPayload,
    UpdateContestPayload,
} from "@/types/contest";

// The backend uses multer (uploadMedia.single("media")) + a zod preprocess
// that accepts branches as either a JSON array string or comma-separated —
// JSON.stringify is the safest form to send.
const buildFormData = (payload: CreateContestPayload | UpdateContestPayload) => {
    const formData = new FormData();

    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.description !== undefined)
        formData.append("description", payload.description);
    if (payload.startDate !== undefined)
        formData.append("startDate", payload.startDate);
    if (payload.endDate !== undefined) formData.append("endDate", payload.endDate);
    if (payload.branches !== undefined)
        formData.append("branches", JSON.stringify(payload.branches));
    if (payload.media) formData.append("media", payload.media);

    return formData;
};

export const contestApi = {
    /** GET /contests/all — Head/Admin only (backend enforces via role check). */
    listAll: async (query: ContestListQuery = {}): Promise<ContestListData> => {
        const { data } = await apiClient.get<ApiEnvelope<ContestListData>>(
            "/contest/all",
            { params: query }
        );
        return data.data;
    },

    contestById: async (id: string): Promise<Contest> => {
        const { data } = await apiClient.get<ApiEnvelope<Contest>>(
            `/contest/${id}`
        );
        return data.data;
    },

    /** GET /contests/my-branch — active contests for the current user's branch. */
    myBranch: async (): Promise<Contest[]> => {
        const { data } = await apiClient.get<ApiEnvelope<Contest[]>>(
            "/contest/my-branch"
        );
        return data.data;
    },

    /** POST /contests — Head only. */
    create: async (payload: CreateContestPayload): Promise<Contest> => {
        const { data } = await apiClient.post<ApiEnvelope<Contest>>(
            "/contest",
            buildFormData(payload)
        );
        return data.data;
    },

    /** PATCH /contests/:id — Head only. */
    update: async (id: string, payload: UpdateContestPayload): Promise<Contest> => {
        const { data } = await apiClient.patch<ApiEnvelope<Contest>>(
            `/contest/${id}`,
            buildFormData(payload)
        );
        return data.data;
    },

    /** PATCH /contests/:id/status — Head only. */
    toggleStatus: async (id: string, isActive: boolean): Promise<Contest> => {
        const { data } = await apiClient.patch<ApiEnvelope<Contest>>(
            `/contest/${id}/status`,
            { isActive }
        );
        return data.data;
    },
};