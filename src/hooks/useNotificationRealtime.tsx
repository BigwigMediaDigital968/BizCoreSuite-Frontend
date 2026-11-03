import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";
import { integrationKeys } from "@/features/integrations/hooks/useIntegrations";
import type { AppNotification } from "@/types/integration";

// Notifications worth interrupting for. Everything else just lights the bell.
const TOAST_TYPES = new Set(["CHAT_CHANNEL_ADDED"]);

/**
 * The server pushes each new notification to the user's socket room. Without
 * this the bell only noticed on its 30s poll; now the dot appears at once, and
 * "you were added to a channel" also shows a toast with a way in.
 */
export const useNotificationRealtime = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!userId) return;
    const socket = connectSocket(userId);

    const handleNotification = (n: AppNotification) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.notifications() });

      if (!TOAST_TYPES.has(n.type)) return;
      toast.custom(
        (t) => (
          <div
            role="status"
            className={`flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg transition-opacity ${
              t.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined mt-0.5 text-xl text-purple-600"
            >
              group_add
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{n.title}</p>
              <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate(`/chat?room=${n.entityId}`);
                  }}
                  className="rounded text-xs font-semibold text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  Open channel
                </button>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="rounded text-xs font-medium text-slate-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    };

    socket.on("NOTIFICATION_RECEIVED", handleNotification);
    return () => {
      socket.off("NOTIFICATION_RECEIVED", handleNotification);
    };
  }, [userId, queryClient, navigate]);
};
