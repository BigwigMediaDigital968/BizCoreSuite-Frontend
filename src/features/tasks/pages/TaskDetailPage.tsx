import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Can } from "@/components/Auth/Can";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useBranchesQuery } from "@/features/branches";
import { useEmployeesQuery } from "@/features/employees";
import { useTask, useTaskActivities, useUpdateTask } from "../hooks/useTasks";
import LeadPicker from "../components/LeadPicker";
import type { Lead } from "@/types/lead";
import {
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
  type TaskActivity,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskPayload,
} from "@/types/task";

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

const ACTIVITY_ICONS: Record<string, string> = {
  created: "add_circle",
  assigned: "person_add",
  reassigned: "sync_alt",
  status_changed: "swap_horiz",
  priority_changed: "flag",
  due_date_changed: "event",
  remark_added: "comment",
  updated: "edit",
  completed: "check_circle",
  cancelled: "cancel",
};

const formatActivityLabel = (activity: TaskActivity) => {
  const performer =
    typeof activity.performedBy === "object"
      ? activity.performedBy.name
      : "Someone";

  switch (activity.activityType) {
    case "created":
      return `${performer} created this task`;
    case "assigned":
      return `${performer} assigned this task`;
    case "reassigned":
      return `${performer} reassigned this task`;
    case "status_changed":
      return `${performer} changed status from "${activity.previousValue?.replace("_", " ") ?? "—"}" to "${activity.newValue?.replace("_", " ") ?? "—"}"`;
    case "priority_changed":
      return `${performer} changed priority from "${activity.previousValue ?? "—"}" to "${activity.newValue ?? "—"}"`;
    case "due_date_changed":
      return `${performer} updated the due date`;
    case "remark_added":
      return `${performer} added a remark`;
    case "completed":
      return `${performer} marked this task as completed`;
    case "cancelled":
      return `${performer} cancelled this task`;
    default:
      return `${performer} updated this task`;
  }
};

const InfoField = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div>
    <span className="text-on-surface-variant/70 font-semibold block text-[11px] uppercase tracking-wide">
      {label}
    </span>
    <span
      className={`text-sm block mt-0.5 ${highlight ? "font-bold text-primary" : "font-bold text-on-surface"}`}
    >
      {value}
    </span>
  </div>
);

const TaskDetailPage = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = useAuthStore((s) => s.user);
  const isEmployee = currentUser?.role === ROLES.EMPLOYEE;
  const isHead = currentUser?.role === ROLES.HEAD;

  const { data: task, isLoading } = useTask(taskId);
  const { data: activities, isLoading: activitiesLoading } =
    useTaskActivities(taskId);
  const updateTask = useUpdateTask();

  // Full Details State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [dueDate, setDueDate] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [isEditingTitleDesc, setIsEditingTitleDesc] = useState(false);

  const [reassignBranchId, setReassignBranchId] = useState("");
  const [reassignEmployeeId, setReassignEmployeeId] = useState("");

  const { data: branches } = useBranchesQuery();

  const assignableBranches = useMemo(() => {
    if (!branches) return [];
    if (isHead) return branches;
    const own = new Set(currentUser?.branches ?? []);
    return branches.filter((b) => own.has(b._id));
  }, [branches, isHead, currentUser?.branches]);

  const { data: employeeData, isLoading: employeesLoading } = useEmployeesQuery(
    {
      role: ROLES.EMPLOYEE,
      branchId: reassignBranchId || undefined,
      isActive: true,
      limit: 100,
    },
  );

  const currentBranch = useMemo(
    () =>
      task?.branch && typeof task.branch === "object" ? task.branch : null,
    [task],
  );

  const currentAssignee = useMemo(
    () =>
      task?.assignedTo && typeof task.assignedTo === "object"
        ? task.assignedTo
        : null,
    [task],
  );

  const assignedBy = useMemo(
    () =>
      task?.assignedBy && typeof task.assignedBy === "object"
        ? task.assignedBy
        : null,
    [task],
  );

  const currentLeads = useMemo(
    () =>
      (task?.leads ?? []).filter(
        (l): l is Exclude<typeof l, string> => typeof l === "object",
      ),
    [task],
  );

  // Sync initial state when task data arrives
  // TaskDetailPage.tsx
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate).toISOString().split("T")[0]);
      }

      // Fallback safely to current branch ID
      const branchId =
        typeof task.branch === "object" ? task.branch?._id : task.branch;
      if (branchId && !reassignBranchId) {
        setReassignBranchId(branchId);
      }
    }
  }, [task]);

  const hasUpdateChanges = useMemo(() => {
    if (!task) return false;
    const isTitleChanged = title.trim() !== "" && title !== task.title;
    const isDescChanged = description !== (task.description || "");
    const isDueDateChanged =
      Boolean(dueDate) &&
      new Date(dueDate).toISOString().split("T")[0] !==
        (task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "");

    return (
      isTitleChanged ||
      isDescChanged ||
      Boolean(status) ||
      Boolean(priority) ||
      isDueDateChanged ||
      Boolean(remarkText.trim())
    );
  }, [title, description, status, priority, dueDate, remarkText, task]);

  const handleSave = async () => {
    if (!taskId) return;

    const payload: UpdateTaskPayload = {};

    if (title.trim() && title !== task?.title) payload.title = title.trim();
    if (description !== task?.description)
      payload.description = description.trim();
    if (status) payload.status = status;
    if (priority) payload.priority = priority;
    if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
    if (remarkText.trim()) payload.remarks = remarkText.trim();

    if (Object.keys(payload).length === 0) return;

    await updateTask.mutateAsync({ id: taskId, payload });

    setStatus("");
    setPriority("");
    setRemarkText("");
    setIsEditingTitleDesc(false);
  };

  const handleReassign = async () => {
    if (!taskId || !reassignEmployeeId) return;

    // Ensure branch ID is always populated
    const targetBranchId =
      reassignBranchId ||
      (typeof task?.branch === "object" ? task.branch._id : task?.branch);

    await updateTask.mutateAsync({
      id: taskId,
      payload: {
        assignedTo: reassignEmployeeId,
        branch: targetBranchId,
      },
    });

    // Reset dropdown state after successful mutation
    setReassignEmployeeId("");
  };

  const handleAddLead = async (lead: Lead) => {
    if (!taskId) return;

    await updateTask.mutateAsync({
      id: taskId,
      payload: { leads: [...currentLeads.map((l) => l._id), lead._id] },
    });
  };

  const handleRemoveLead = async (leadId: string) => {
    if (!taskId) return;

    await updateTask.mutateAsync({
      id: taskId,
      payload: {
        leads: currentLeads.filter((l) => l._id !== leadId).map((l) => l._id),
      },
    });
  };

  if (isLoading || !task) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-outline-variant/30 pb-4">
        <div className="flex items-start gap-3 w-full">
          <button
            type="button"
            onClick={() => navigate("/tasks")}
            className="rounded-lg border border-outline-variant/30 p-2 hover:bg-surface-container-low transition-colors shrink-0 mt-1"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
          </button>

          <div className="flex-1 min-w-0">
            {isEditingTitleDesc ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                placeholder="Task Title"
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-sm text-2xl font-bold text-on-surface break-words">
                  {task.title}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${STATUS_BADGE_CLASSES[task.status]}`}
                >
                  {TASK_STATUS_LABELS[task.status]}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${PRIORITY_BADGE_CLASSES[task.priority]}`}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    flag
                  </span>
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
                {!isEmployee && (
                  <button
                    onClick={() => setIsEditingTitleDesc(!isEditingTitleDesc)}
                    className="text-on-surface-variant hover:text-primary p-1 rounded-md transition-colors"
                    title="Edit Title & Description"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                  </button>
                )}
              </div>
            )}

            <p className="font-body-sm text-xs text-on-surface-variant mt-1">
              Created {new Date(task.createdAt).toLocaleString()} · Last updated{" "}
              {new Date(task.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Operations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label-md text-xs font-bold uppercase text-primary">
                Task Overview
              </h3>
              {!isEmployee && !isEditingTitleDesc && (
                <button
                  type="button"
                  onClick={() => setIsEditingTitleDesc(true)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Edit Overview
                </button>
              )}
            </div>

            {isEditingTitleDesc ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full resize-none rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                    placeholder="Enter detailed task description..."
                  />
                </div>
              </div>
            ) : (
              task.description && (
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              )
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <InfoField
                label="Branch"
                value={currentBranch ? currentBranch.name : "—"}
              />
              <InfoField
                label="Assigned To"
                value={currentAssignee ? currentAssignee.name : "Unassigned"}
                highlight
              />
              <InfoField
                label="Assigned By"
                value={assignedBy ? assignedBy.name : "—"}
              />
              <InfoField
                label="Linked Leads"
                value={
                  currentLeads.length > 0
                    ? currentLeads.map((l) => l.name).join(", ")
                    : "None"
                }
              />
              <InfoField
                label="Due Date"
                value={
                  task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "No due date"
                }
              />
              {task.completedAt && (
                <InfoField
                  label="Completed"
                  value={new Date(task.completedAt).toLocaleDateString()}
                />
              )}
            </div>

            {task.remarks && (
              <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low/40 p-3">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant/60 block mb-1">
                  Latest Remarks
                </span>
                <p className="text-xs text-on-surface-variant">
                  {task.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Update Task Form Card */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4">
            <h3 className="font-label-md text-xs font-bold uppercase text-primary">
              Update Task Status & Attributes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="">
                    Current: {TASK_STATUS_LABELS[task.status]}
                  </option>
                  {Object.values(TASK_STATUS).map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              {!isEmployee && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                  >
                    <option value="">
                      Current: {TASK_PRIORITY_LABELS[task.priority]}
                    </option>
                    {Object.values(TASK_PRIORITY).map((p) => (
                      <option key={p} value={p}>
                        {TASK_PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isEmployee && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Add Remark / Activity Note
              </label>
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="Add a remark or progress note..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                className="w-full resize-none rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            {updateTask.isError && (
              <p className="text-xs text-rose-600">
                {getErrorMessage(updateTask.error, "Failed to update task")}
              </p>
            )}

            <div className="flex justify-end gap-2">
              {isEditingTitleDesc && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTitleDesc(false);
                    setTitle(task.title || "");
                    setDescription(task.description || "");
                  }}
                  className="rounded-lg border border-outline-variant/40 px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasUpdateChanges || updateTask.isPending}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {updateTask.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Reassign & Lead Link Row */}
          {!isEmployee && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Can permission="task:assign">
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-3">
                  <h4 className="font-label-md text-xs font-bold uppercase text-on-surface">
                    Reassign Task
                  </h4>
                  {assignableBranches.length <= 1 ? (
                    <div className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
                      {assignableBranches[0]?.name ?? "No branch assigned"}
                    </div>
                  ) : (
                    <select
                      value={reassignBranchId}
                      onChange={(e) => {
                        setReassignBranchId(e.target.value);
                        setReassignEmployeeId(""); // Prevent sending an employee ID from a different branch
                      }}
                      className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                    >
                      <option value="">Select branch</option>
                      {assignableBranches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    disabled={!reassignBranchId || employeesLoading}
                    value={reassignEmployeeId}
                    onChange={(e) => setReassignEmployeeId(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="">
                      {employeesLoading ? "Loading..." : "Select employee"}
                    </option>
                    {employeeData?.employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleReassign}
                    disabled={!reassignEmployeeId || updateTask.isPending}
                    className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-on-primary disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </Can>

              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-3">
                <h4 className="font-label-md text-xs font-bold uppercase text-on-surface">
                  Linked Leads
                </h4>
                <LeadPicker
                  branchId={currentBranch?._id ?? ""}
                  selectedLeads={currentLeads}
                  onAdd={handleAddLead}
                  onRemove={handleRemoveLead}
                  disabled={updateTask.isPending}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Activity Stream */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto">
          <h3 className="font-label-md text-xs font-bold uppercase text-primary">
            Activity Timeline
          </h3>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-lg text-primary">
                progress_activity
              </span>
            </div>
          ) : !activities || activities.length === 0 ? (
            <p className="text-xs text-on-surface-variant">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity._id} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-sm text-primary mt-0.5 shrink-0">
                    {ACTIVITY_ICONS[activity.activityType] ?? "info"}
                  </span>
                  <div className="min-w-0 flex-1 border-l-2 border-primary/20 pl-3 -ml-[13px] pb-1">
                    <p className="text-xs font-medium text-on-surface leading-snug">
                      {formatActivityLabel(activity)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
