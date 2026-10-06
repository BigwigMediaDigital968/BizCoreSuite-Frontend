import type { BranchRef } from "./branch";

export interface ContestMedia {
    url: string;
    publicId: string;
    resourceType: "image" | "video" | "raw";
    format?: string;
    originalName?: string;
}

export interface ContestCreatorRef {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export interface Contest {
    _id: string;
    title: string;
    description: string;
    branches: BranchRef[] | string[];
    media?: ContestMedia;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdBy: ContestCreatorRef | string;
    createdAt: string;
    updatedAt: string;
}

export interface ContestListQuery {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    branchId?: string;
}

export interface ContestListData {
    contests: Contest[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateContestPayload {
    title: string;
    description: string;
    branches: string[];
    startDate: string; // ISO datetime
    endDate: string; // ISO datetime
    media?: File | null;
}

export type UpdateContestPayload = Partial<CreateContestPayload>;