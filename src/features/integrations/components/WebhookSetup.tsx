import { useState } from "react";
import toast from "react-hot-toast";

import type { Integration } from "@/types/integration";
import { timeAgo } from "../utils";

const WATI_EVENTS = [
  "New contact message",
  "Message received",
  "Session message sent",
  "Template message sent",
  "Sent message delivered",
  "Sent message read",
  "Template message failed",
];

/** The webhook URL plus the steps to paste it into WATI, with a live "first event" indicator. */
const WebhookSetup = ({ integration, compact = false }: { integration: Integration; compact?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const url = integration.webhookUrl ?? "";
  const receiving = Boolean(integration.stats.lastEventAt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the URL and copy it manually.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-on-surface">Webhook URL</p>
        <div className="flex items-stretch gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Webhook URL"
            className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 font-mono text-[11px] text-on-surface outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={copy}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-base">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-on-surface-variant">
          Treat this URL like a password: anyone with it can send events. Regenerate it on the integration page if it leaks.
        </p>
      </div>

      {!compact && (
        <ol className="space-y-2.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4 text-xs text-on-surface">
          {[
            <>In WATI, open <b>Webhooks</b> from the top menu and click <b>Add Webhook</b>.</>,
            <>Paste the URL above and set the status to <b>Enabled</b>.</>,
            <>
              Tick these events: {WATI_EVENTS.map((e, i) => (
                <span key={e}>
                  <b>{e}</b>
                  {i < WATI_EVENTS.length - 1 ? ", " : "."}
                </span>
              ))}
            </>,
            <>Save, then click <b>Trigger sample callback</b> (or send a WhatsApp message to your number) to test.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${
          receiving ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-800"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          {!receiving && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60 motion-reduce:animate-none" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${receiving ? "bg-emerald-500" : "bg-amber-500"}`} />
        </span>
        {receiving
          ? `Receiving events · last one ${timeAgo(integration.stats.lastEventAt)}`
          : "Waiting for the first event from WATI…"}
      </div>
    </div>
  );
};

export default WebhookSetup;
