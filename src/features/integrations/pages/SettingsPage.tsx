import { Link, useSearchParams } from "react-router";

import { ROUTES } from "@/config/routes";
import { Can } from "@/components/Auth/Can";
import { PERMISSIONS } from "@/types/auth";
import { useIntegrations, useProviders } from "../hooks/useIntegrations";
import { ASSIGNMENT_LABELS, STATUS_STYLES, timeAgo } from "../utils";

// New settings areas get their own tab here.
const TABS = [{ id: "integrations", label: "Integrations", icon: "hub" }] as const;

const PROVIDER_ICONS: Record<string, string> = {
  wati: "chat",
  meta_lead_ads: "campaign",
  indiamart: "storefront",
  website_form: "web",
};

const connectPath = (provider: string) => ROUTES.integrationConnect.replace(":provider", provider);

const SettingsPage = () => {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get("tab"))?.id ?? "integrations";
  const { data: integrations, isLoading, isError } = useIntegrations();
  const { data: providers } = useProviders();

  return (
    <div className="min-h-screen space-y-6 bg-surface p-4 sm:p-6 lg:p-8">
      <div className="border-b border-outline-variant/30 pb-5">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <span className="h-0.5 w-4 rounded-full bg-primary" />
          <span>System</span>
        </div>
        <h1 className="font-headline-md text-2xl font-extrabold text-on-surface sm:text-3xl">Settings</h1>
        <p className="mt-1 max-w-2xl text-xs text-on-surface-variant sm:text-sm">
          Connect lead sources so new enquiries arrive in Leads automatically and get assigned.
        </p>
      </div>

      <div role="tablist" aria-label="Settings sections" className="flex gap-1 overflow-x-auto border-b border-outline-variant/30">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Connected */}
      <section aria-labelledby="connected-heading" className="space-y-3">
        <h2 id="connected-heading" className="text-sm font-bold text-on-surface">
          Connected
        </h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container-high" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-on-surface-variant">Failed to load integrations.</p>
        ) : !integrations?.length ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">hub</span>
            <p className="mt-2 text-sm font-bold text-on-surface">No integrations yet</p>
            <p className="mt-1 text-xs text-on-surface-variant">Connect a lead source below to start syncing leads.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((i) => {
              const status = STATUS_STYLES[i.status];
              return (
                <Link
                  key={i._id}
                  to={ROUTES.integrationDetail.replace(":id", i._id)}
                  className="group flex flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <span className="material-symbols-outlined">{PROVIDER_ICONS[i.provider] ?? "hub"}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-on-surface">{i.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">{i.provider}</p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-[11px] text-on-surface-variant">Leads created</dt>
                      <dd className="text-lg font-extrabold tabular-nums text-on-surface">{i.stats.leadsCreated}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-on-surface-variant">Last event</dt>
                      <dd className="font-semibold text-on-surface">
                        {i.stats.lastEventAt ? timeAgo(i.stats.lastEventAt) : <span className="text-amber-700">Waiting…</span>}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 border-t border-outline-variant/20 pt-3 text-[11px] text-on-surface-variant">
                    {i.routing.branch?.name ?? "No branch"} · {ASSIGNMENT_LABELS[i.routing.assignment].label}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Available */}
      <section aria-labelledby="available-heading" className="space-y-3">
        <h2 id="available-heading" className="text-sm font-bold text-on-surface">
          Available lead sources
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(providers ?? []).map((p) => (
            <div
              key={p.provider}
              className={`flex flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 ${p.available ? "" : "opacity-70"}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
                  <span className="material-symbols-outlined">{PROVIDER_ICONS[p.provider] ?? "hub"}</span>
                </span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{p.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{p.category}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-xs text-on-surface-variant">{p.description}</p>
              {p.available ? (
                <Can permission={PERMISSIONS.INTEGRATION_MANAGE}>
                  <Link
                    to={connectPath(p.provider)}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90"
                  >
                    <span className="material-symbols-outlined text-base">add_link</span>
                    Connect
                  </Link>
                </Can>
              ) : (
                <span className="mt-4 inline-flex items-center justify-center rounded-xl border border-outline-variant/40 px-4 py-2.5 text-xs font-bold text-on-surface-variant">
                  Coming soon
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
