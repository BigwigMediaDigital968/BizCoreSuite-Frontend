import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useTask, useUpdateTask } from "../hooks/useTasks";
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-indigo-500/10 text-indigo-700 border-indigo-200/40",
  in_progress: "bg-sky-500/10 text-sky-700 border-sky-200/40",
  on_hold: "bg-amber-500/10 text-amber-700 border-amber-200/40",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-200/40",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-200/40",
};

const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  low: "bg-surface-container-high text-on-surface-variant",
  medium: "bg-sky-500/10 text-sky-700",
  high: "bg-amber-500/10 text-amber-700",
  urgent: "bg-rose-500/10 text-rose-700",
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant/60 block">
      {label}
    </span>
    <span className="font-body-sm text-xs truncate block font-semibold text-on-surface">
      {value}
    </span>
  </div>
);

const TaskDetailModal = ({ taskId, onClose }: TaskDetailModalProps) => {
  const open = Boolean(taskId);
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isEmployee = currentUser?.role === ROLES.EMPLOYEE;

  const { data: task, isLoading } = useTask(taskId ?? undefined);
  const updateTask = useUpdateTask();

  const [status, setStatus] = useState<TaskStatus | "">("");
  const [remarkText, setRemarkText] = useState("");

  useEffect(() => {
    if (!open) return;
    setStatus("");
    setRemarkText("");
  }, [open, taskId]);

  const currentAssignee =
    task?.assignedTo && typeof task.assignedTo === "object" ? task.assignedTo : null;

  const hasChanges = Boolean(status) || Boolean(remarkText.trim());

  const handleQuickSave = async () => {
    if (!taskId) return;

    if (status) {
      await updateTask.mutateAsync({ id: taskId, payload: { status } });
    }
    if (remarkText.trim()) {
      await updateTask.mutateAsync({ id: taskId, payload: { remarks: remarkText.trim() } });
    }

    setStatus("");
    setRemarkText("");
    onClose();
  };

  const handleViewFullDetails = () => {
    if (!taskId) return;
    onClose();
    navigate(`/tasks/${taskId}`);
  };

  return (
    <Modal title="Task Quick View" open={open} onClose={onClose} size="md">
      {isLoading || !task ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">
            progress_activity
          </span>
          <p className="font-label-sm text-xs text-on-surface-variant font-medium">
            Loading task...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b border-outline-variant/20 pb-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-sm text-base font-bold text-on-surface break-words">
                {task.title}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${STATUS_BADGE_CLASSES[task.status]}`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${PRIORITY_BADGE_CLASSES[task.priority]}`}
              >
                <span className="material-symbols-outlined text-[12px]">flag</span>
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
            </div>
          </div>

          {/* Small info snapshot */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5">
            <InfoField
              label="Assigned To"
              value={currentAssignee ? currentAssignee.name : "Unassigned"}
            />
            <InfoField
              label="Due Date"
              value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
            />
            <InfoField label="Last Update" value={new Date(task.updatedAt).toLocaleString()} />
            <InfoField label="Created" value={new Date(task.createdAt).toLocaleDateString()} />
          </div>

          {task.remarks && (
            <p className="text-xs text-on-surface-variant line-clamp-2">
              <span className="font-bold text-on-surface-variant/70">Remarks: </span>
              {task.remarks}
            </p>
          )}

          {/* Quick update */}
          <div className="rounded-xl border border-outline-variant/30 p-3.5 space-y-3">
            <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant/70">
              Quick Update
            </span>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
            >
              <option value="">Change status (current: {TASK_STATUS_LABELS[task.status]})</option>
              {Object.values(TASK_STATUS).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Add a quick remark..."
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          {updateTask.isError && (
            <p className="text-xs text-rose-600">
              {getErrorMessage(updateTask.error, "Failed to update task")}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleViewFullDetails}
              className="inline-flex items-center gap-1 font-label-sm text-xs font-bold text-primary hover:underline"
            >
              {isEmployee ? "View Full Details" : "View Full Details & Manage"}
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-outline-variant/40 px-3.5 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={!hasChanges || updateTask.isPending}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {updateTask.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
