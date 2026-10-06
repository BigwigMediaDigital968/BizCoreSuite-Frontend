import { useState } from "react";
import { Link } from "react-router";

import Modal from "@/components/ui/Modal";
import Pager from "@/features/dailyReports/components/Pager";
import type { IntegrationEvent, IntegrationEventOutcome } from "@/types/integration";
import { useIntegrationEvents, useRetryEvent } from "../hooks/useIntegrations";
import { controlClass, formatDateTime, OUTCOME_STYLES } from "../utils";

/** Every webhook event received, with its outcome; failed ones can be retried. */
const EventLog = ({ integrationId }: { integrationId: string }) => {
  const [outcome, setOutcome] = useState<IntegrationEventOutcome | "">("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<IntegrationEvent | null>(null);
  const { data, isLoading, isError } = useIntegrationEvents(integrationId, outcome || undefined, page);
  const retry = useRetryEvent(integrationId);
  const events = data?.events ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value as IntegrationEventOutcome | "");
            setPage(1);
          }}
          aria-label="Filter by outcome"
          className={controlClass}
        >
          <option value="">All events</option>
          {(Object.keys(OUTCOME_STYLES) as IntegrationEventOutcome[])
            .filter((o) => o !== "processing")
            .map((o) => (
              <option key={o} value={o}>
                {OUTCOME_STYLES[o].label}
              </option>
            ))}
        </select>
        <p className="ml-auto text-[11px] text-on-surface-variant">Kept for 30 days · refreshes every 15 s</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                <th className="py-2.5 px-4">Received</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Lead</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-2.5 px-4">
                      <div className="h-6 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-on-surface-variant">Failed to load events.</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-on-surface-variant">
                    No events yet. They appear here as soon as WATI starts calling the webhook.
                  </td>
                </tr>
              ) : (
                events.map((e) => {
                  const style = OUTCOME_STYLES[e.outcome] ?? OUTCOME_STYLES.ignored;
                  return (
                    <tr key={e._id} className="align-top">
                      <td className="whitespace-nowrap py-2.5 px-4 text-on-surface-variant">{formatDateTime(e.receivedAt)}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{e.eventType}</td>
                      <td className="py-2.5 px-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${style.className}`}>{style.label}</span>
                        {e.error && <p className="mt-1 max-w-xs text-[11px] text-error">{e.error}</p>}
                      </td>
                      <td className="py-2.5 px-3">
                        {e.lead ? (
                          <Link to={`/leads/${e.lead._id}`} className="font-semibold text-primary hover:underline">
                            {e.lead.name}
                          </Link>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewing(e)}
                            className="rounded-lg px-2 py-1 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container"
                          >
                            Payload
                          </button>
                          {e.outcome === "failed" && (
                            <button
                              type="button"
                              onClick={() => retry.mutate(e._id)}
                              disabled={retry.isPending}
                              className="rounded-lg px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10 disabled:opacity-50"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pager pagination={data?.pagination} noun="events" onPageChange={setPage} />
      </div>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        size="lg"
        title={viewing?.eventType ?? "Event"}
        description={viewing ? `Received ${formatDateTime(viewing.receivedAt)} · attempt ${viewing.attempts}` : undefined}
      >
        <pre className="max-h-[60vh] overflow-auto rounded-xl bg-surface-container-low p-4 text-[11px] leading-relaxed text-on-surface">
          {viewing ? JSON.stringify(viewing.payload, null, 2) : ""}
        </pre>
      </Modal>
    </div>
  );
};

export default EventLog;
