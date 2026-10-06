import { useBranchesQuery } from "@/features/branches";
import { useEmployeesQuery } from "@/features/employees";
import type { IntegrationAssignment, IntegrationRoutingInput } from "@/types/integration";
import { ASSIGNMENT_LABELS, controlClass, type RoutingValues } from "../utils";

/** Where new integration leads go and who gets them. Shared by Connect and the detail page. */
const RoutingFields = ({ value, onChange }: { value: RoutingValues; onChange: (next: RoutingValues) => void }) => {
  const { data: branches } = useBranchesQuery();
  const { data: people } = useEmployeesQuery(
    { isActive: true, limit: 100, branchId: value.routing.branch ?? undefined },
    { enabled: value.routing.assignment === "fixed_user" }
  );
  const setRouting = (patch: Partial<IntegrationRoutingInput>) =>
    onChange({ ...value, routing: { ...value.routing, ...patch } });

  return (
    <div className="space-y-5">
      <label className="block space-y-1.5">
        <span className="block text-xs font-semibold text-on-surface">Branch for new leads</span>
        <select
          value={value.routing.branch ?? ""}
          onChange={(e) => setRouting({ branch: e.target.value || null, fixedUser: null })}
          className={`${controlClass} w-full`}
        >
          <option value="">No branch (only Head sees them until assigned)</option>
          {(branches ?? []).filter((b) => b.isActive !== false).map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-semibold text-on-surface">Who gets new leads</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(ASSIGNMENT_LABELS) as IntegrationAssignment[]).map((key) => {
            const active = value.routing.assignment === key;
            return (
              <label
                key={key}
                className={`cursor-pointer rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-primary/30 ${
                  active ? "border-primary bg-primary/5" : "border-outline-variant/40 hover:bg-surface-container"
                }`}
              >
                <input
                  type="radio"
                  name="assignment"
                  value={key}
                  checked={active}
                  onChange={() => setRouting({ assignment: key })}
                  className="sr-only"
                />
                <span className={`block text-xs font-bold ${active ? "text-primary" : "text-on-surface"}`}>
                  {ASSIGNMENT_LABELS[key].label}
                </span>
                <span className="mt-0.5 block text-[11px] text-on-surface-variant">{ASSIGNMENT_LABELS[key].description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {value.routing.assignment === "fixed_user" && (
        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-on-surface">Person</span>
          <select
            value={value.routing.fixedUser ?? ""}
            onChange={(e) => setRouting({ fixedUser: e.target.value || null })}
            className={`${controlClass} w-full`}
          >
            <option value="">Choose…</option>
            {(people?.employees ?? [])
              .filter((p) => p.role !== "head")
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} · {p.role}
                </option>
              ))}
          </select>
        </label>
      )}

      <label className="block space-y-1.5">
        <span className="block text-xs font-semibold text-on-surface">Source label</span>
        <input
          value={value.sourceLabel}
          maxLength={100}
          onChange={(e) => onChange({ ...value, sourceLabel: e.target.value })}
          className={`${controlClass} w-full`}
        />
        <span className="block text-[11px] text-on-surface-variant">Shown as the lead's source, and usable as a filter in Leads.</span>
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold text-on-surface">Create a lead when</legend>
        <label className="flex items-start gap-2 text-xs text-on-surface">
          <input
            type="checkbox"
            checked={value.createLeadOn.newContact}
            onChange={(e) => onChange({ ...value, createLeadOn: { ...value.createLeadOn, newContact: e.target.checked } })}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <b>A new contact messages you</b>
            <span className="block text-[11px] text-on-surface-variant">Someone who has never messaged your WhatsApp number before.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs text-on-surface">
          <input
            type="checkbox"
            checked={value.createLeadOn.messageFromUnknown}
            onChange={(e) =>
              onChange({ ...value, createLeadOn: { ...value.createLeadOn, messageFromUnknown: e.target.checked } })
            }
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <b>Any message from a number that isn't a lead yet</b>
            <span className="block text-[11px] text-on-surface-variant">A safety net for contacts that existed in WATI before you connected.</span>
          </span>
        </label>
      </fieldset>
    </div>
  );
};

export default RoutingFields;
