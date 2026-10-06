import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ROUTES } from "@/config/routes";
import type { Integration } from "@/types/integration";
import RoutingFields from "../components/RoutingFields";
import WebhookSetup from "../components/WebhookSetup";
import { useCreateIntegration, useIntegration, useTestIntegration } from "../hooks/useIntegrations";
import { controlClass, routingError, type RoutingValues } from "../utils";

const STEPS = ["Credentials", "Lead routing", "Webhook"] as const;

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm sm:p-6">{children}</div>
);

/** Connect a lead source in three steps. Only WATI exists today. */
const ConnectIntegrationPage = () => {
  const { provider = "wati" } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("WATI");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tested, setTested] = useState<{ ok: boolean; account: string | null; error: string | null } | null>(null);
  const [routing, setRouting] = useState<RoutingValues>({
    routing: { branch: null, assignment: "unassigned", fixedUser: null },
    sourceLabel: "WATI",
    createLeadOn: { newContact: true, messageFromUnknown: true },
  });
  const [created, setCreated] = useState<Integration | null>(null);

  const test = useTestIntegration();
  const create = useCreateIntegration();
  // Poll the new integration so the "first event" indicator turns green by itself.
  const { data: live } = useIntegration(created?._id);

  if (provider !== "wati") {
    return (
      <div className="p-8 text-center text-xs text-on-surface-variant">
        This lead source isn't available yet. <Link to={ROUTES.settings} className="font-bold text-primary">Back to Settings</Link>
      </div>
    );
  }

  const credentials = { apiEndpoint: apiEndpoint.trim(), token: token.trim() };
  const credentialsComplete = /^https:\/\/.+/.test(credentials.apiEndpoint) && credentials.token.length >= 20 && name.trim().length >= 2;
  const routeError = routingError(routing);

  const runTest = () =>
    test.mutate({ provider, credentials }, { onSuccess: (result) => setTested(result) });

  const handleCreate = () =>
    create.mutate(
      {
        provider,
        name: name.trim(),
        credentials,
        routing: routing.routing,
        sourceLabel: routing.sourceLabel.trim(),
        createLeadOn: routing.createLeadOn,
      },
      {
        onSuccess: (response) => {
          setCreated(response.data);
          setStep(2);
        },
      }
    );

  return (
    <div className="min-h-screen space-y-6 bg-surface p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 border-b border-outline-variant/30 pb-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Link to={ROUTES.settings} className="font-bold hover:text-primary">Settings</Link>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
          <span>Connect WATI</span>
        </nav>
        <h1 className="font-headline-md text-2xl font-extrabold text-on-surface sm:text-3xl">Connect WATI</h1>
        <ol className="flex flex-wrap items-center gap-2" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2" aria-current={i === step ? "step" : undefined}>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i === step ? "bg-primary text-on-primary" : i < step ? "bg-primary/15 text-primary" : "border border-outline-variant/60 text-on-surface-variant"
                }`}
              >
                {i < step ? <span className="material-symbols-outlined text-base">check</span> : i + 1}
              </span>
              <span className={`text-xs font-bold ${i === step ? "text-on-surface" : "text-on-surface-variant"}`}>{label}</span>
              {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-8 bg-outline-variant/50" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        {step === 0 && (
          <Card>
            <h2 className="text-base font-bold text-on-surface">Your WATI API credentials</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              In WATI, go to <b>Connector → API</b>. Copy the <b>API Endpoint</b>, then create an access token with access to
              contacts, messages, templates and webhooks.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold text-on-surface">Name</span>
                <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className={`${controlClass} w-full`} />
                <span className="block text-[11px] text-on-surface-variant">For your reference, e.g. "WATI – Sales number".</span>
              </label>
              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold text-on-surface">API endpoint</span>
                <input
                  value={apiEndpoint}
                  onChange={(e) => {
                    setApiEndpoint(e.target.value);
                    setTested(null);
                  }}
                  placeholder="https://live-mt-server.wati.io/123456"
                  inputMode="url"
                  autoComplete="off"
                  className={`${controlClass} w-full font-mono`}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold text-on-surface">Access token</span>
                <div className="flex gap-2">
                  <input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setTested(null);
                    }}
                    placeholder="Bearer eyJhbGciOi…"
                    autoComplete="off"
                    spellCheck={false}
                    className={`${controlClass} min-w-0 flex-1 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    aria-label={showToken ? "Hide token" : "Show token"}
                    className="flex w-11 items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-base">{showToken ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                <span className="block text-[11px] text-on-surface-variant">Stored encrypted. It can't be viewed again after saving.</span>
              </label>
            </div>

            {tested && (
              <div
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${tested.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-error/10 text-error"}`}
              >
                <span className="material-symbols-outlined text-base">{tested.ok ? "check_circle" : "error"}</span>
                <span>{tested.ok ? `Connected${tested.account ? `: ${tested.account}` : ""}` : tested.error}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Link to={ROUTES.settings} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
                Cancel
              </Link>
              <button
                type="button"
                onClick={runTest}
                disabled={!credentialsComplete || test.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-primary/40 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-40"
              >
                {test.isPending && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Test connection
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!tested?.ok}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
              >
                Next: lead routing
              </button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <h2 className="text-base font-bold text-on-surface">Where do new WhatsApp leads go?</h2>
            <p className="mt-1 mb-5 text-xs text-on-surface-variant">
              A number that's already a lead is attached to that lead, whichever branch it's in. It's never duplicated.
            </p>
            <RoutingFields value={routing} onChange={setRouting} />
            {routeError && <p className="mt-4 text-xs font-semibold text-error">{routeError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setStep(0)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!!routeError || create.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
              >
                {create.isPending && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Connect & get webhook URL
              </button>
            </div>
          </Card>
        )}

        {step === 2 && created && (
          <Card>
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-800">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>
                <b>{created.name}</b> is connected. One last step: tell WATI where to send new contacts and messages.
              </span>
            </div>
            <WebhookSetup integration={live ?? created} />
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(ROUTES.integrationDetail.replace(":id", created._id), { replace: true })}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm"
              >
                Done
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConnectIntegrationPage;
