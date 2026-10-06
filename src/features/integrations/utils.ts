import type {
  IntegrationAssignment,
  IntegrationEventOutcome,
  IntegrationRoutingInput,
  IntegrationStatus,
} from "@/types/integration";

export const controlClass =
  "rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export const timeAgo = (iso?: string | null) => {
  if (!iso) return "never";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const STATUS_STYLES: Record<IntegrationStatus, { label: string; className: string; dot: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  paused: { label: "Paused", className: "bg-on-surface-variant/10 text-on-surface-variant", dot: "bg-on-surface-variant" },
  error: { label: "Needs attention", className: "bg-error/10 text-error", dot: "bg-error" },
};

export const ASSIGNMENT_LABELS: Record<IntegrationAssignment, { label: string; description: string }> = {
  unassigned: {
    label: "Leave unassigned",
    description: "Leads land in the branch; managers assign them.",
  },
  round_robin: {
    label: "Round robin",
    description: "Rotate new leads across the branch's active employees.",
  },
  fixed_user: {
    label: "One person",
    description: "Every new lead goes to the person you choose.",
  },
};

export const OUTCOME_STYLES: Record<IntegrationEventOutcome, { label: string; className: string }> = {
  lead_created: { label: "Lead created", className: "bg-emerald-500/10 text-emerald-700" },
  lead_matched: { label: "Matched lead", className: "bg-primary/10 text-primary" },
  message_logged: { label: "Message logged", className: "bg-sky-500/10 text-sky-700" },
  status_updated: { label: "Status update", className: "bg-surface-container-high text-on-surface-variant" },
  ignored: { label: "Ignored", className: "bg-surface-container-high text-on-surface-variant" },
  failed: { label: "Failed", className: "bg-error/10 text-error" },
  processing: { label: "Processing", className: "bg-amber-500/15 text-amber-700" },
};

/** Lead routing form values, shared by Connect and the detail page. */
export interface RoutingValues {
  routing: IntegrationRoutingInput;
  sourceLabel: string;
  createLeadOn: { newContact: boolean; messageFromUnknown: boolean };
}

export const routingError = (v: RoutingValues): string | null => {
  if (!v.sourceLabel.trim()) return "Give the leads a source label";
  if (v.routing.assignment === "round_robin" && !v.routing.branch) return "Round robin needs a branch";
  if (v.routing.assignment === "fixed_user" && !v.routing.fixedUser) return "Choose who receives the leads";
  if (!v.createLeadOn.newContact && !v.createLeadOn.messageFromUnknown) return "Choose at least one way to create leads";
  return null;
};
