import {
  LEAVE_REQUEST_STATUS_LABELS,
  type LeaveRequestStatus,
} from "@/types/leave";

const STATUS_CLASSES: Record<LeaveRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  approved: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-error/10 text-error",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

const LeaveStatusBadge = ({ status }: { status: LeaveRequestStatus }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-label-sm text-[10px] font-bold capitalize ${STATUS_CLASSES[status]}`}
  >
    {LEAVE_REQUEST_STATUS_LABELS[status]}
  </span>
);

export default LeaveStatusBadge;
