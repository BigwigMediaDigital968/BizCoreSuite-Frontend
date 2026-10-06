import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Can } from "@/components/Auth/Can";
import { useTasks } from "../hooks/useTasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/types/task";

const STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-indigo-500",
  in_progress: "bg-sky-500",
  on_hold: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

const PRIORITY_RANK: Record<Task["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const isOverdue = (task: Task) =>
  Boolean(
    task.dueDate &&
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      new Date(task.dueDate).getTime() < Date.now()
  );

interface TaskOverviewWidgetProps {
  title?: string;
  description?: string;
}

/**
 * Self-fetching task summary for the Head / Admin dashboards. GET /tasks is
 * already role-scoped server-side (task.service.ts getTasks: Head sees every
 * branch, Admin/Manager only their assigned branches, Employee only their
 * own tasks) — this widget just reads whatever comes back, so the branch
 * filter below naturally only ever offers branches the caller can see.
 */
const TaskOverviewWidget = ({
  title = "Task Overview",
  description = "Live snapshot of task load and progress.",
}: TaskOverviewWidgetProps) => {
  const { data: tasks, isLoading } = useTasks();
  const [branchFilter, setBranchFilter] = useState("");

  const allTasks = useMemo(() => tasks ?? [], [tasks]);

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach((task) => {
      if (task.branch && typeof task.branch === "object") {
        map.set(task.branch._id, task.branch.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    if (!branchFilter) return allTasks;
    return allTasks.filter(
      (task) => typeof task.branch === "object" && task.branch._id === branchFilter
    );
  }, [allTasks, branchFilter]);

  const stats = useMemo(
    () => ({
      total: filteredTasks.length,
      todo: filteredTasks.filter((t) => t.status === "todo").length,
      inProgress: filteredTasks.filter((t) => t.status === "in_progress").length,
      completed: filteredTasks.filter((t) => t.status === "completed").length,
      overdue: filteredTasks.filter(isOverdue).length,
    }),
    [filteredTasks]
  );

  const urgentTasks = useMemo(() => {
    return [...filteredTasks]
      .filter((t) => t.status !== "completed" && t.status !== "cancelled")
      .sort((a, b) => {
        const overdueDelta = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdueDelta !== 0) return overdueDelta;
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      })
      .slice(0, 5);
  }, [filteredTasks]);

  return (
    <Can permission="task:view">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">{title}</h3>
            <p className="font-body-sm text-xs text-on-surface-variant">{description}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {branchOptions.length > 1 && (
              <div className="relative">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 pr-8 font-label-sm text-xs font-semibold text-on-surface outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">All Branches</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
                  expand_more
                </span>
              </div>
            )}

            <Can permission="task:create">
              <Link
                to="/tasks/new"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-label-sm text-xs font-bold text-on-primary hover:bg-primary/90 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Create Task
              </Link>
            </Can>
          </div>
        </div>

        {/* Stat mini-cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: "list_alt", color: "text-on-surface" },
            { label: "To Do", value: stats.todo, icon: "radio_button_unchecked", color: "text-indigo-600" },
            { label: "In Progress", value: stats.inProgress, icon: "autorenew", color: "text-sky-600" },
            { label: "Completed", value: stats.completed, icon: "check_circle", color: "text-emerald-600" },
            { label: "Overdue", value: stats.overdue, icon: "warning", color: "text-rose-600" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-wide text-on-surface-variant/70">
                  {card.label}
                </span>
                <span className={`material-symbols-outlined text-sm ${card.color}`}>{card.icon}</span>
              </div>
              {isLoading ? (
                <div className="h-6 w-10 rounded bg-surface-container-high animate-pulse" />
              ) : (
                <p className="font-headline-sm text-xl font-extrabold text-on-surface">{card.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Needs-attention list */}
        <div className="space-y-2">
          <span className="font-label-sm text-[10px] font-bold uppercase tracking-wide text-on-surface-variant/60">
            Needs Attention
          </span>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-surface-container-high animate-pulse" />
              ))}
            </div>
          ) : urgentTasks.length === 0 ? (
            <p className="py-4 text-center font-body-sm text-xs text-on-surface-variant/70">
              Nothing urgent — all caught up.
            </p>
          ) : (
            <div className="divide-y divide-outline-variant/10 rounded-xl border border-outline-variant/20">
              {urgentTasks.map((task) => {
                const assignee =
                  typeof task.assignedTo === "object" ? task.assignedTo : null;
                const overdue = isOverdue(task);

                return (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASSES[task.status]}`} />
                      <div className="min-w-0">
                        <p className="truncate font-label-sm text-xs font-bold text-on-surface">
                          {task.title}
                        </p>
                        <p className="truncate font-body-sm text-[10px] text-on-surface-variant/70">
                          {assignee ? assignee.name : "Unassigned"} ·{" "}
                          {TASK_PRIORITY_LABELS[task.priority]} priority
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {task.dueDate ? (
                        <p
                          className={`font-label-sm text-[10px] font-bold ${overdue ? "text-rose-600" : "text-on-surface-variant"}`}
                        >
                          {overdue ? "Overdue" : "Due"} {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="font-label-sm text-[10px] text-on-surface-variant/60">
                          {TASK_STATUS_LABELS[task.status]}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Link
          to="/tasks"
          className="block w-full py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low font-label-md text-xs font-bold text-on-surface text-center hover:bg-surface-container transition-colors"
        >
          View All Tasks
        </Link>
      </div>
    </Can>
  );
};

export default TaskOverviewWidget;
