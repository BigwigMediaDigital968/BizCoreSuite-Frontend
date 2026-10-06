import type { BranchRef } from "./branch";

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Slim user shape the backend populates onto assignedTo / assignedBy / createdBy. */
export interface TaskUserSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface TaskLeadSummary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;

  /** Populated on list/get responses; falls back to a raw id elsewhere. */
  branch: BranchRef | string;

  /** Multi-lead link — populated as objects on list/get, raw ids elsewhere. */
  leads?: (TaskLeadSummary | string)[];

  assignedTo: TaskUserSummary | string;
  assignedBy: TaskUserSummary | string;

  priority: TaskPriority;
  status: TaskStatus;

  dueDate?: string;
  completedAt?: string;

  remarks?: string;

  createdBy: TaskUserSummary | string;

  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  leads?: string[];
  assignedTo: string;
  priority?: TaskPriority;
  dueDate?: string;
  remarks?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  remarks?: string;
  completedAt?: string | null;
  assignedTo?: string;
  branch?: string;
  leads?: string[] | null;
}

/** Mirrors task.service.ts getTasks' GetTasksQueryParams. */
export interface TaskListQuery {
  branch?: string;
  assignedTo?: string;
  lead?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const TASK_ACTIVITY_TYPE = {
  CREATED: "created",
  ASSIGNED: "assigned",
  REASSIGNED: "reassigned",
  STATUS_CHANGED: "status_changed",
  PRIORITY_CHANGED: "priority_changed",
  DUE_DATE_CHANGED: "due_date_changed",
  REMARK_ADDED: "remark_added",
  UPDATED: "updated",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TaskActivityType =
  (typeof TASK_ACTIVITY_TYPE)[keyof typeof TASK_ACTIVITY_TYPE];

export interface TaskActivity {
  _id: string;
  task: string;
  activityType: TaskActivityType;
  performedBy: TaskUserSummary | string;
  branch: string;
  previousValue?: string;
  newValue?: string;
  remark?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
