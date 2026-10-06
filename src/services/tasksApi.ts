import { apiClient } from "./apiClient";
import type { ApiEnvelope } from "./apiEnvelope";
import type {
  CreateTaskPayload,
  Task,
  TaskActivity,
  TaskListQuery,
  UpdateTaskPayload,
} from "@/types/task";

export const tasksApi = {
  /**
   * GET /tasks
   * The backend scopes the result set to the caller's role (Head sees
   * everything, Admin/Manager see their branches, Employee sees only their
   * own tasks) on top of whichever of these query params are passed
   * (branch/assignedTo/lead/status/priority/search/startDate/endDate) —
   * see task.service.ts getTasks.
   */
  list: async (query: TaskListQuery = {}): Promise<Task[]> => {
    const { data } = await apiClient.get<ApiEnvelope<Task[]>>("/tasks", {
      params: query,
    });
    return data.data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<ApiEnvelope<Task>>(`/tasks/${id}`);
    return data.data;
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.post<ApiEnvelope<Task>>(
      "/tasks",
      payload
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.patch<ApiEnvelope<Task>>(
      `/tasks/${id}`,
      payload
    );
    return data.data;
  },

  getActivities: async (id: string): Promise<TaskActivity[]> => {
    const { data } = await apiClient.get<ApiEnvelope<TaskActivity[]>>(
      `/tasks/${id}/activities`
    );
    return data.data;
  },
};
