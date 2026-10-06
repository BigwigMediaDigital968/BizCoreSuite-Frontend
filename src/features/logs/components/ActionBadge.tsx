interface ActionStyleConfig {
  badge: string;
  dot: string;
}

const DEFAULT_STYLE: ActionStyleConfig = {
  badge: "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/30",
  dot: "bg-on-surface-variant/50",
};

const ACTION_STYLES: Record<string, ActionStyleConfig> = {
  // Positive / Creation actions
  CREATED: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  ACTIVATED: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  LOGIN_SUCCESS: {
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    dot: "bg-sky-500",
  },
  // Mutation / Warning / Caution actions
  UPDATED: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  ROLE_UPDATED: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  CHANGED: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  RESET: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },

  // Destructive / Error / Negative actions
  DELETED: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
  DEACTIVATED: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
  REVOKED: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
  FAILED: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },

  // Neutral / System actions
  LOGOUT: DEFAULT_STYLE,
};

const resolveStyle = (action: string): ActionStyleConfig => {
  const normalized = action.toUpperCase();

  // Check longer keys first (e.g. DEACTIVATED before ACTIVATED)
  const sortedKeys = Object.keys(ACTION_STYLES).sort((a, b) => b.length - a.length);
  const matchedKey = sortedKeys.find((key) => normalized.includes(key));

  return matchedKey ? ACTION_STYLES[matchedKey] : DEFAULT_STYLE;
};

interface ActionBadgeProps {
  action: string;
  className?: string;
}

const ActionBadge = ({ action, className = "" }: ActionBadgeProps) => {
  const { badge, dot } = resolveStyle(action);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{action.replaceAll("_", " ")}</span>
    </span>
  );
};

export default ActionBadge;