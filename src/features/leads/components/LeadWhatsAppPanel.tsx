import { useEffect, useMemo, useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS } from "@/types/auth";
import type { LeadMessage, WhatsAppTemplate } from "@/types/integration";
import {
  useLeadConversation,
  useLeadTemplates,
  useSendLeadMessage,
} from "@/features/integrations/hooks/useIntegrations";

interface LeadWhatsAppPanelProps {
  leadId: string;
  leadName: string;
}

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const remaining = (closesAt: string, now: number) => {
  const ms = new Date(closesAt).getTime() - now;
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const StatusTicks = ({ message }: { message: LeadMessage }) => {
  const map: Record<string, { icon: string; label: string; className: string }> = {
    pending: { icon: "schedule", label: "Sending", className: "text-on-surface-variant/70" },
    sent: { icon: "check", label: "Sent", className: "text-on-surface-variant/70" },
    delivered: { icon: "done_all", label: "Delivered", className: "text-on-surface-variant/70" },
    read: { icon: "done_all", label: "Read", className: "text-sky-600" },
    failed: { icon: "error", label: `Failed${message.error ? `: ${message.error}` : ""}`, className: "text-error" },
  };
  const s = map[message.status];
  if (!s) return null;
  return (
    <span className={`material-symbols-outlined !text-[14px] leading-none ${s.className}`} title={s.label} aria-label={s.label}>
      {s.icon}
    </span>
  );
};

const Bubble = ({ message }: { message: LeadMessage }) => {
  const outbound = message.direction === "out";
  const who = outbound
    ? message.sentFromProvider
      ? `${message.senderName ?? "Agent"} · via WATI`
      : message.sentBy?.name ?? message.senderName ?? "You"
    : null;
  return (
    <div className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
          outbound
            ? message.status === "failed"
              ? "rounded-br-md border border-error/30 bg-error/5 text-on-surface"
              : "rounded-br-md bg-emerald-50 text-on-surface dark:bg-emerald-900/30"
            : "rounded-bl-md border border-outline-variant/30 bg-surface-container-lowest text-on-surface"
        }`}
      >
        {message.templateName && (
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            <span className="material-symbols-outlined !text-[12px]">description</span>
            Template · {message.templateName}
          </p>
        )}
        {message.text ? (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        ) : (
          <p className="italic text-on-surface-variant">[{message.type}]</p>
        )}
        {message.mediaUrl && (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] font-bold text-primary hover:underline">
            Open attachment
          </a>
        )}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-on-surface-variant/80">
          {who && <span className="mr-1 truncate">{who}</span>}
          <time dateTime={message.sentAt}>{clock(message.sentAt)}</time>
          {outbound && <StatusTicks message={message} />}
        </div>
        {message.status === "failed" && message.error && (
          <p className="mt-1 text-[10px] text-error">{message.error}</p>
        )}
      </div>
    </div>
  );
};

const TemplatePicker = ({
  open,
  onClose,
  leadId,
  leadName,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
}) => {
  const { data: templates, isLoading, isError, error } = useLeadTemplates(leadId, open);
  const send = useSendLeadMessage(leadId);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WhatsAppTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const choose = (t: WhatsAppTemplate) => {
    setSelected(t);
    // Prefill the obvious ones from the lead.
    setValues(Object.fromEntries(t.params.map((p) => [p, /^(name|1|customer_name|first_name)$/i.test(p) ? leadName : ""])));
  };

  const preview = selected?.body?.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => values[k] || m) ?? null;
  const missing = selected ? selected.params.filter((p) => !values[p]?.trim()) : [];
  const filtered = (templates ?? []).filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()));

  const close = () => {
    setSelected(null);
    setSearch("");
    onClose();
  };

  return (
    <Modal open={open} onClose={close} size="lg" title="Send a WhatsApp template" description="Only templates approved by WhatsApp are listed.">
      {!selected ? (
        <div className="space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 text-xs outline-none focus:border-primary"
          />
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-surface-container-high" />
          ) : isError ? (
            <p className="text-xs text-error">{(error as Error)?.message ?? "Couldn't load templates"}</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-on-surface-variant">No approved templates found.</p>
          ) : (
            <ul className="max-h-[50vh] divide-y divide-outline-variant/20 overflow-y-auto rounded-xl border border-outline-variant/30">
              {filtered.map((t) => (
                <li key={t.name}>
                  <button type="button" onClick={() => choose(t)} className="w-full px-4 py-3 text-left hover:bg-surface-container-low">
                    <p className="text-xs font-bold text-on-surface">
                      {t.name}
                      <span className="ml-2 font-normal text-on-surface-variant">{[t.category, t.language].filter(Boolean).join(" · ")}</span>
                    </p>
                    {t.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-on-surface-variant">{t.body}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            All templates
          </button>
          <p className="text-sm font-bold text-on-surface">{selected.name}</p>
          {selected.params.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {selected.params.map((p) => (
                <label key={p} className="block space-y-1">
                  <span className="block text-[11px] font-semibold text-on-surface-variant">{`{{${p}}}`}</span>
                  <input
                    value={values[p] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [p]: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
          )}
          {preview && (
            <div className="rounded-2xl rounded-br-md bg-emerald-50 px-3.5 py-2.5 text-xs text-on-surface dark:bg-emerald-900/30">
              <p className="whitespace-pre-wrap">{preview}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
              Cancel
            </button>
            <button
              type="button"
              disabled={missing.length > 0 || send.isPending}
              onClick={() =>
                send.mutate(
                  {
                    type: "template",
                    templateName: selected.name,
                    templateBody: selected.body,
                    params: selected.params.map((p) => ({ name: p, value: values[p]?.trim() ?? "" })),
                  },
                  { onSuccess: close }
                )
              }
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
            >
              {send.isPending ? "Sending…" : missing.length ? `Fill ${missing.length} field${missing.length === 1 ? "" : "s"}` : "Send template"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

/**
 * WhatsApp for one lead. It only exists on the lead page, so it inherits the
 * lead's access rules: an employee only ever sees chats of leads assigned to them.
 */
const LeadWhatsAppPanel = ({ leadId, leadName }: LeadWhatsAppPanelProps) => {
  const { data, isLoading, isError } = useLeadConversation(leadId);
  const send = useSendLeadMessage(leadId);
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const messages = useMemo(() => data?.messages ?? [], [data?.messages]);
  const lastId = messages[messages.length - 1]?._id;
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-surface-container-high" />;
  if (isError) return <p className="text-xs text-on-surface-variant">Couldn't load the WhatsApp conversation.</p>;
  if (!data?.integration) {
    return (
      <p className="text-[11px] italic text-on-surface-variant/80">
        WhatsApp isn't connected. Head can connect WATI in Settings → Integrations.
      </p>
    );
  }

  const windowLeft = data.windowClosesAt ? remaining(data.windowClosesAt, now) : null;
  const windowOpen = data.windowOpen && Boolean(windowLeft);

  const sendText = () => {
    const value = text.trim();
    if (!value) return;
    send.mutate({ type: "text", text: value }, { onSuccess: () => setText("") });
  };

  let lastDay = "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
        <span>
          +{data.contact} · via {data.integration.name}
          {data.integration.status !== "active" && <span className="ml-1 font-bold text-amber-700">({data.integration.status})</span>}
        </span>
        <span className={`flex items-center gap-1 font-semibold ${windowOpen ? "text-emerald-700" : "text-on-surface-variant"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${windowOpen ? "bg-emerald-500" : "bg-on-surface-variant/50"}`} />
          {windowOpen ? `Reply window open · closes in ${windowLeft}` : "Reply window closed"}
        </span>
      </div>

      <div
        ref={threadRef}
        className="max-h-[420px] min-h-[160px] space-y-2 overflow-y-auto rounded-xl bg-surface-container-low/60 p-3"
        aria-live="polite"
        aria-label="WhatsApp conversation"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-on-surface-variant">
            No WhatsApp messages yet. Start the conversation with an approved template.
          </p>
        ) : (
          messages.map((m) => {
            const day = dayLabel(m.sentAt);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={m._id} className="space-y-2">
                {showDay && (
                  <p className="text-center">
                    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[10px] font-bold text-on-surface-variant">{day}</span>
                  </p>
                )}
                <Bubble message={m} />
              </div>
            );
          })
        )}
      </div>

      <Can permission={PERMISSIONS.LEAD_MESSAGE_SEND}>
        {windowOpen ? (
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendText();
                }
              }}
              rows={2}
              maxLength={4096}
              placeholder="Type a reply… (Enter to send, Shift+Enter for a new line)"
              aria-label="WhatsApp reply"
              className="min-w-0 flex-1 resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3.5 py-2.5 text-xs outline-none focus:border-primary"
            />
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={sendText}
                disabled={!text.trim() || send.isPending}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">send</span>
                Send
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-xl px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Template
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3.5 py-3 text-xs">
            <span className="material-symbols-outlined text-base text-on-surface-variant">lock_clock</span>
            <span className="min-w-0 flex-1 text-on-surface-variant">
              WhatsApp allows free-text replies only within 24 hours of the lead's last message. Use an approved template to
              {messages.length ? " re-open" : " start"} the conversation.
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <span className="material-symbols-outlined text-base">description</span>
              Send template
            </button>
          </div>
        )}
        {pickerOpen && <TemplatePicker open onClose={() => setPickerOpen(false)} leadId={leadId} leadName={leadName} />}
      </Can>
    </div>
  );
};

export default LeadWhatsAppPanel;
