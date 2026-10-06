import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import { TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/types/task";
import {
  PRIORITY_BADGE_CLASSES,
  STATUS_DOT_CLASSES,
  isDueSoon,
  isOverdue,
} from "../taskDisplay";

/** On Hold and Cancelled share one column — most boards don't need either
 * as its own full lane, and splitting them out kept the board at 5 columns
 * instead of the usual 4. The merged column's own filter (below) picks
 * which of the two you're looking at, and what a drop into it turns into. */
type HoldCancelledFilter = "all" | "on_hold" | "cancelled";

interface BoardColumnDef {
  id: string;
  label: string;
  statuses: TaskStatus[];
  accent: string;
}

const BOARD_COLUMNS: BoardColumnDef[] = [
  { id: "todo", label: TASK_STATUS_LABELS.todo, statuses: ["todo"], accent: "border-t-indigo-500" },
  {
    id: "in_progress",
    label: TASK_STATUS_LABELS.in_progress,
    statuses: ["in_progress"],
    accent: "border-t-sky-500",
  },
  {
    id: "completed",
    label: TASK_STATUS_LABELS.completed,
    statuses: ["completed"],
    accent: "border-t-emerald-500",
  },
  {
    id: "on_hold_cancelled",
    label: "On Hold & Cancelled",
    statuses: ["on_hold", "cancelled"],
    accent: "border-t-amber-500",
  },
];

interface TaskBoardProps {
  tasks: Task[];
  isEmployee: boolean;
  canDrag: boolean;
  onOpenTask: (id: string) => void;
  onStatusChange: (task: Task, nextStatus: TaskStatus) => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const TaskCard = ({
  task,
  isEmployee,
  canDrag,
  showStatusDot,
  onOpenTask,
}: {
  task: Task;
  isEmployee: boolean;
  canDrag: boolean;
  /** The merged On Hold/Cancelled column shows both statuses at once when
   * its filter is "All", so each card needs its own status indicator to
   * tell them apart — single-status columns don't need this. */
  showStatusDot: boolean;
  onOpenTask: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task._id, disabled: !canDrag });

  const assignee = typeof task.assignedTo === "object" ? task.assignedTo : null;
  const overdue = isOverdue(task);
  const dueSoon = isDueSoon(task);

  const urgencyBorder = overdue
    ? "border-l-[3px] border-l-rose-500"
    : dueSoon
      ? "border-l-[3px] border-l-amber-500"
      : "border-l-[3px] border-l-transparent";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpenTask(task._id)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`${urgencyBorder} rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-sm transition-shadow hover:shadow-md ${
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {showStatusDot && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[task.status]}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            {TASK_STATUS_LABELS[task.status]}
          </span>
        </div>
      )}

      <p className="text-xs font-bold text-on-surface line-clamp-2">{task.title}</p>

      {task.description && (
        <p className="mt-1 text-[11px] text-on-surface-variant/70 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_BADGE_CLASSES[task.priority]}`}
        >
          {task.priority}
        </span>

        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
              overdue ? "text-rose-600" : dueSoon ? "text-amber-600" : "text-on-surface-variant/70"
            }`}
          >
            {(overdue || dueSoon) && (
              <span className="material-symbols-outlined text-[12px]">warning</span>
            )}
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {!isEmployee && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-outline-variant/15 pt-2">
          {assignee ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                {getInitials(assignee.name)}
              </span>
              <span className="truncate text-[10px] font-semibold text-on-surface-variant">
                {assignee.name}
              </span>
            </>
          ) : (
            <span className="text-[10px] font-semibold text-on-surface-variant/50 italic">
              Unassigned
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const BoardColumn = ({
  column,
  tasks,
  isEmployee,
  canDrag,
  holdCancelledFilter,
  onHoldCancelledFilterChange,
  onOpenTask,
}: {
  column: BoardColumnDef;
  tasks: Task[];
  isEmployee: boolean;
  canDrag: boolean;
  holdCancelledFilter: HoldCancelledFilter;
  onHoldCancelledFilterChange: (filter: HoldCancelledFilter) => void;
  onOpenTask: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const isMerged = column.id === "on_hold_cancelled";

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-low/40">
      <div className={`border-t-[3px] px-3.5 py-3 ${column.accent}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            {column.label}
          </span>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant shrink-0">
            {tasks.length}
          </span>
        </div>

        {isMerged && (
          <select
            value={holdCancelledFilter}
            onChange={(e) => onHoldCancelledFilterChange(e.target.value as HoldCancelledFilter)}
            className="mt-2 w-full appearance-none rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-[10px] font-semibold text-on-surface-variant outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All</option>
            <option value="on_hold">On Hold only</option>
            <option value="cancelled">Cancelled only</option>
          </select>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2.5 min-h-[120px] transition-colors ${
          isOver ? "bg-primary/5" : ""
        }`}
      >
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-on-surface-variant/50">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isEmployee={isEmployee}
              canDrag={canDrag}
              showStatusDot={isMerged && holdCancelledFilter === "all"}
              onOpenTask={onOpenTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TaskBoard = ({ tasks, isEmployee, canDrag, onOpenTask, onStatusChange }: TaskBoardProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [holdCancelledFilter, setHoldCancelledFilter] = useState<HoldCancelledFilter>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const columns = BOARD_COLUMNS.map((column) => {
    const inColumn = tasks.filter((t) => column.statuses.includes(t.status));
    const visible =
      column.id === "on_hold_cancelled" && holdCancelledFilter !== "all"
        ? inColumn.filter((t) => t.status === holdCancelledFilter)
        : inColumn;
    return { column, tasks: visible };
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const targetColumn = BOARD_COLUMNS.find((c) => c.id === event.over?.id);
    const task = tasks.find((t) => t._id === event.active.id);
    if (!task || !targetColumn) return;

    // Dropped back into the column it already belongs to (e.g. a Cancelled
    // card re-dropped in the merged column while filter is "All") — no
    // status change, since we have no within-column reorder to persist.
    if (targetColumn.statuses.includes(task.status)) return;

    const nextStatus =
      targetColumn.id === "on_hold_cancelled"
        ? holdCancelledFilter === "all"
          ? "on_hold"
          : holdCancelledFilter
        : targetColumn.statuses[0];

    onStatusChange(task, nextStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map(({ column, tasks: columnTasks }) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={columnTasks}
            isEmployee={isEmployee}
            canDrag={canDrag}
            holdCancelledFilter={holdCancelledFilter}
            onHoldCancelledFilterChange={setHoldCancelledFilter}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-72 rounded-xl border border-primary/40 bg-surface-container-lowest p-3 shadow-lg">
            <p className="text-xs font-bold text-on-surface line-clamp-2">
              {activeTask.title}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;
