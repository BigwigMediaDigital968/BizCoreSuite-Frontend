import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Can } from "@/components/Auth/Can";
import { ROUTES } from "@/config/routes";
import { PERMISSIONS } from "@/types/auth";
import type { Integration } from "@/types/integration";
import EventLog from "../components/EventLog";
import RoutingFields from "../components/RoutingFields";
import WebhookSetup from "../components/WebhookSetup";
import {
  useDeleteIntegration,
  useImportContacts,
  useIntegration,
  usePauseIntegration,
  useResumeIntegration,
  useRotateWebhook,
  useUpdateIntegration,
} from "../hooks/useIntegrations";
import { controlClass, formatDateTime, routingError, STATUS_STYLES, timeAgo, type RoutingValues } from "../utils";

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
    <h2 className="text-sm font-bold text-on-surface">{title}</h2>
    {description && <p className="mt-0.5 text-[11px] text-on-surface-variant">{description}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const toRouting = (i: Integration): RoutingValues => ({
  routing: {
    branch: i.routing.branch?._id ?? null,
    assignment: i.routing.assignment,
    fixedUser: i.routing.fixedUser?._id ?? null,
  },
  sourceLabel: i.leadDefaults.sourceLabel,
  createLeadOn: { ...i.createLeadOn },
});

/** Editable settings; remounted (via key) whenever the saved integration changes. */
const SettingsForm = ({ integration }: { integration: Integration }) => {
  const update = useUpdateIntegration(integration._id);
  const [name, setName] = useState(integration.name);
  const [routing, setRouting] = useState<RoutingValues>(() => toRouting(integration));
  const [newToken, setNewToken] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const error = routingError(routing) ?? (name.trim().length < 2 ? "Give the integration a name" : null);
  const replacingCredentials = newToken.trim().length > 0;

  const save = () =>
    update.mutate({
      name: name.trim(),
      routing: routing.routing,
      sourceLabel: routing.sourceLabel.trim(),
      createLeadOn: routing.createLeadOn,
      ...(replacingCredentials
        ? { credentials: { apiEndpoint: (newEndpoint.trim() || "").replace(/\/+$/, ""), token: newToken.trim() } }
        : {}),
    });

  return (
    <div className="space-y-5">
      <label className="block space-y-1.5">
        <span className="block text-xs font-semibold text-on-surface">Name</span>
        <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className={`${controlClass} w-full`} />
      </label>
      <RoutingFields value={routing} onChange={setRouting} />
      <details className="rounded-xl border border-outline-variant/30 p-4">
        <summary className="cursor-pointer text-xs font-bold text-on-surface">
          Replace API credentials <span className="font-normal text-on-surface-variant">(current token {integration.credentialsHint})</span>
        </summary>
        <div className="mt-3 space-y-3">
          <input
            value={newEndpoint}
            onChange={(e) => setNewEndpoint(e.target.value)}
            placeholder="https://live-mt-server.wati.io/123456"
            aria-label="New API endpoint"
            className={`${controlClass} w-full font-mono`}
          />
          <input
            type="password"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder="New access token"
            autoComplete="off"
            aria-label="New access token"
            className={`${controlClass} w-full font-mono`}
          />
          <p className="text-[11px] text-on-surface-variant">Both are tested before saving. Leave empty to keep the current ones.</p>
        </div>
      </details>
      {error && <p className="text-xs font-semibold text-error">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!!error || update.isPending || (replacingCredentials && !/^https:\/\//.test(newEndpoint.trim()))}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
        >
          {update.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
};

const IntegrationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: integration, isLoading, isError } = useIntegration(id);
  const pause = usePauseIntegration();
  const resume = useResumeIntegration();
  const rotate = useRotateWebhook();
  const remove = useDeleteIntegration();
  const importContacts = useImportContacts();
  const [confirm, setConfirm] = useState<"rotate" | "delete" | "import" | null>(null);

  const back = (
    <Link to={ROUTES.settings} className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary">
      <span className="material-symbols-outlined text-base">arrow_back</span>
      Settings
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {back}
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container-high" />
      </div>
    );
  }
  if (isError || !integration) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {back}
        <p className="py-10 text-center text-xs text-on-surface-variant">Integration not found.</p>
      </div>
    );
  }

  const status = STATUS_STYLES[integration.status];
  const importing = integration.import?.status === "running";

  return (
    <div className="min-h-screen space-y-5 bg-surface p-4 sm:p-6 lg:p-8">
      <div className="space-y-3 border-b border-outline-variant/30 pb-5">
        {back}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-md text-2xl font-extrabold text-on-surface sm:text-3xl">{integration.name}</h1>
              <span className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              WATI · connected {formatDateTime(integration.createdAt)}
              {integration.createdBy && ` by ${integration.createdBy.name}`}
            </p>
          </div>
          <Can permission={PERMISSIONS.INTEGRATION_MANAGE}>
            <div className="flex flex-wrap gap-2">
              {integration.status === "paused" || integration.status === "error" ? (
                <button
                  type="button"
                  onClick={() => resume.mutate(integration._id)}
                  disabled={resume.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => pause.mutate(integration._id)}
                  disabled={pause.isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">pause</span>
                  Pause
                </button>
              )}
            </div>
          </Can>
        </div>
      </div>

      {integration.status === "error" && integration.stats.lastError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-xs text-error">
          <span className="material-symbols-outlined text-base">error</span>
          <span>
            Several events in a row failed. Last error ({timeAgo(integration.stats.lastErrorAt)}): {integration.stats.lastError}. Check the
            event log, fix the cause (often an expired token), then resume.
          </span>
        </div>
      )}
      {integration.status === "paused" && (
        <div className="rounded-xl bg-surface-container px-4 py-3 text-xs text-on-surface-variant">
          Paused: WATI's events are acknowledged but ignored, so no leads are created until you resume.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Leads created", value: String(integration.stats.leadsCreated) },
          { label: "Events received", value: String(integration.stats.eventsReceived) },
          { label: "Last event", value: integration.stats.lastEventAt ? timeAgo(integration.stats.lastEventAt) : "Waiting…" },
          { label: "Failures in a row", value: String(integration.stats.consecutiveFailures) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
            <p className="text-[11px] text-on-surface-variant">{s.label}</p>
            <p className="text-lg font-extrabold tabular-nums text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Webhook" description="WATI sends new contacts, messages and delivery updates here.">
          <WebhookSetup integration={integration} compact={Boolean(integration.stats.lastEventAt)} />
          <Can permission={PERMISSIONS.INTEGRATION_MANAGE}>
            <button
              type="button"
              onClick={() => setConfirm("rotate")}
              className="mt-3 text-[11px] font-bold text-on-surface-variant hover:text-error"
            >
              Regenerate webhook URL
            </button>
          </Can>
        </Section>

        <Section
          title="Import existing contacts"
          description="Create leads for contacts already in WATI. Numbers that are already leads are attached, not duplicated."
        >
          {integration.import && (
            <div className="mb-3 rounded-xl bg-surface-container-low px-3 py-2.5 text-xs">
              <p className="font-bold text-on-surface">
                {importing ? "Importing…" : integration.import.status === "completed" ? "Last import completed" : "Last import failed"}
                <span className="ml-1 font-normal text-on-surface-variant">
                  {importing ? `started ${timeAgo(integration.import.startedAt)}` : formatDateTime(integration.import.finishedAt)}
                </span>
              </p>
              <p className="mt-0.5 text-on-surface-variant">
                {integration.import.processed} checked · {integration.import.created} new leads · {integration.import.matched} already in the CRM
                {integration.import.failed ? ` · ${integration.import.failed} failed` : ""}
              </p>
              {integration.import.error && <p className="mt-0.5 text-error">{integration.import.error}</p>}
            </div>
          )}
          <Can permission={PERMISSIONS.INTEGRATION_MANAGE}>
            <button
              type="button"
              onClick={() => setConfirm("import")}
              disabled={importing || importContacts.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-primary/40 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-40"
            >
              {importing && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
              {importing ? "Import running" : "Import contacts"}
            </button>
          </Can>
        </Section>
      </div>

      <Section title="Event log" description="Every call from WATI and what the CRM did with it.">
        <EventLog integrationId={integration._id} />
      </Section>

      <Can permission={PERMISSIONS.INTEGRATION_MANAGE}>
        <Section title="Settings" description="Changes apply to leads that arrive from now on.">
          <SettingsForm key={integration.updatedAt} integration={integration} />
        </Section>

        <section className="rounded-2xl border border-error/30 bg-error/5 p-5">
          <h2 className="text-sm font-bold text-error">Delete integration</h2>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            Stops syncing. Leads it created, and their WhatsApp history, stay in the CRM. Remove the webhook in WATI too.
          </p>
          <button
            type="button"
            onClick={() => setConfirm("delete")}
            className="mt-3 rounded-xl bg-error px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-error/90"
          >
            Delete
          </button>
        </section>
      </Can>

      <ConfirmDialog
        open={confirm === "rotate"}
        onClose={() => setConfirm(null)}
        onConfirm={() => rotate.mutate(integration._id, { onSuccess: () => setConfirm(null) })}
        title="Regenerate the webhook URL?"
        description="The current URL stops working immediately. Paste the new one into WATI straight away, or events will be lost until you do."
        confirmLabel="Regenerate"
        tone="danger"
        isLoading={rotate.isPending}
      />
      <ConfirmDialog
        open={confirm === "import"}
        onClose={() => setConfirm(null)}
        onConfirm={() => importContacts.mutate(integration._id, { onSuccess: () => setConfirm(null) })}
        title="Import existing WATI contacts?"
        description="Each contact becomes a lead routed by this integration's settings. This can take a few minutes for large accounts; you'll be notified when it's done."
        confirmLabel="Start import"
        isLoading={importContacts.isPending}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          remove.mutate(integration._id, {
            onSuccess: () => navigate(ROUTES.settings, { replace: true }),
          })
        }
        title={`Delete ${integration.name}?`}
        description="New WhatsApp contacts will stop becoming leads. Existing leads and messages are kept."
        confirmLabel="Delete"
        tone="danger"
        isLoading={remove.isPending}
      />
    </div>
  );
};

export default IntegrationDetailPage;
