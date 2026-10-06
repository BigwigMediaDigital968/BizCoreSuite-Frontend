import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { contestApi } from "@/services/contestApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
    ContestListQuery,
    CreateContestPayload,
    UpdateContestPayload,
} from "@/types/contest";

export const contestKeys = {
    all: ["contests"] as const,
    contest :  (id:string) => ['contest', id] as const,
    list: (query: ContestListQuery) => [...contestKeys.all, "list", query] as const,
    myBranch: () => [...contestKeys.all, "my-branch"] as const,
};

export const useContestsQuery = (query: ContestListQuery = {}) =>
    useQuery({
        queryKey: contestKeys.list(query),
        queryFn: () => contestApi.listAll(query),
        placeholderData: keepPreviousData,
    });

export const useContestId = (id:string) =>
    useQuery({
        queryKey: contestKeys.contest(id),
        queryFn: ()=> contestApi.contestById(id),
        enabled: !!id
    });

export const useMyBranchContestsQuery = () =>
    useQuery({
        queryKey: contestKeys.myBranch(),
        queryFn: () => contestApi.myBranch(),
    });

export const useCreateContest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateContestPayload) => contestApi.create(payload),
        onSuccess: () => {
            toast.success("Contest launched successfully");
            queryClient.invalidateQueries({ queryKey: contestKeys.all });
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to launch contest")),
    });
};

export const useUpdateContest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateContestPayload }) =>
            contestApi.update(id, payload),
        onSuccess: () => {
            toast.success("Contest updated successfully");
            queryClient.invalidateQueries({ queryKey: contestKeys.all });
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to update contest")),
    });
};

export const useToggleContestStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            contestApi.toggleStatus(id, isActive),
        onSuccess: (contest) => {
            toast.success(contest.isActive ? "Contest activated" : "Contest deactivated");
            queryClient.invalidateQueries({ queryKey: contestKeys.all });
        },
        onError: (error) =>
            toast.error(getErrorMessage(error, "Failed to update contest status")),
    });
};