import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { AppNotification } from "@/types/integration";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/integrations/hooks/useIntegrations";

const ICONS: Record<string, string> = {
  INTEGRATION_LEAD_CREATED: "person_add",
  LEAD_WHATSAPP_RECEIVED: "chat",
  INTEGRATION_ERROR: "error",
  LEAD_ASSIGNED: "assignment_ind",
  LEAD_REASSIGNED: "assignment_ind",
  DAILY_REPORT_REVIEWED: "assignment_turned_in",
};

const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

/**
 * Where a notification leads. WhatsApp messages jump to the lead's WhatsApp
 * card. Integration notifications deliberately link nowhere: Settings isn't
 * exposed on the live site yet, so they render as plain, non-clickable rows.
 */
const targetFor = (n: AppNotification): string | null => {
  if (!n.entityId) return null;
  if (n.entityType === "Lead") return `/leads/${n.entityId}${n.type === "LEAD_WHATSAPP_RECEIVED" ? "#whatsapp" : ""}`;
  return null;
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data } = useNotifications(open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = data?.unread ?? 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openNotification = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n._id);
    const to = targetFor(n);
    if (!to) return;
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
            <p className="text-sm font-bold text-on-surface">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] divide-y divide-outline-variant/15 overflow-y-auto">
            {!data?.notifications.length ? (
              <li className="px-4 py-10 text-center text-xs text-on-surface-variant">You're all caught up.</li>
            ) : (
              data.notifications.map((n) => {
                const to = targetFor(n);
                const rowClass = `flex w-full gap-3 px-4 py-3 text-left ${n.isRead ? "" : "bg-primary/5"}`;
                const content = (
                  <>
                    <span className={`material-symbols-outlined mt-0.5 text-lg ${n.type === "INTEGRATION_ERROR" ? "text-error" : "text-primary"}`}>
                      {ICONS[n.type] ?? "notifications"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-xs ${n.isRead ? "font-semibold" : "font-bold"} text-on-surface`}>{n.title}</span>
                        <span className="shrink-0 text-[10px] text-on-surface-variant">{timeAgo(n.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[11px] text-on-surface-variant">{n.message}</span>
                    </span>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </>
                );
                return (
                  <li key={n._id}>
                    {to ? (
                      <button
                        type="button"
                        onClick={() => openNotification(n)}
                        className={`${rowClass} transition-colors hover:bg-surface-container-low`}
                      >
                        {content}
                      </button>
                    ) : (
                      // Informational only (e.g. integration alerts): no link.
                      <div className={rowClass}>{content}</div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
