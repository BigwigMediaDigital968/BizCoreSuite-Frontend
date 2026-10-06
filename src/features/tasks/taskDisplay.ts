import type { Task, TaskPriority, TaskStatus } from "@/types/task";

/** Shared badge/column styling and urgency logic for the task list and board views. */

export const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-indigo-500/10 text-indigo-700",
  in_progress: "bg-sky-500/10 text-sky-700",
  on_hold: "bg-amber-500/10 text-amber-700",
  completed: "bg-emerald-500/10 text-emerald-700",
  cancelled: "bg-rose-500/10 text-rose-700",
};

export const STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-indigo-500",
  in_progress: "bg-sky-500",
  on_hold: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

export const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  low: "bg-surface-container-high text-on-surface-variant",
  medium: "bg-sky-500/10 text-sky-700",
  high: "bg-amber-500/10 text-amber-700",
  urgent: "bg-rose-500/10 text-rose-700",
};

export const isTerminalStatus = (status: TaskStatus) =>
  status === "completed" || status === "cancelled";

export const isOverdue = (task: Task) =>
  Boolean(
    task.dueDate &&
      !isTerminalStatus(task.status) &&
      new Date(task.dueDate).getTime() < Date.now()
  );

// Due within the next 24h but not yet overdue — a softer "act soon" cue
// alongside the harder red "overdue" one.
const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;
export const isDueSoon = (task: Task) =>
  Boolean(
    task.dueDate &&
      !isTerminalStatus(task.status) &&
      !isOverdue(task) &&
      new Date(task.dueDate).getTime() - Date.now() <= DUE_SOON_WINDOW_MS
  );
