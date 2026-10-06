import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useBlocker, useNavigate, useSearchParams } from "react-router";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ROUTES } from "@/config/routes";
import { useBranchesQuery } from "@/features/branches";
import { todayInput } from "@/utils/Date";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type {
  Decision,
  OverrideField,
  OverrideInput,
  PayoutAdjustment,
  PayoutInput,
  PayoutPreview,
} from "@/types/salary";
import PayoutLinesTable from "../components/salary/PayoutLinesTable";
import type { BreakdownEditHandlers } from "../components/salary/PayoutLineBreakdown";
import {
  useEligibleEmployees,
  useGeneratePayout,
  usePayoutPreview,
} from "../hooks/useSalary";
import { controlClass, formatPeriod, inr, monthRange, useDebounced } from "../utils";

const MAX_RANGE_DAYS = 31;

const STEPS = [
  { label: "Date range", hint: "Pick the period" },
  { label: "Employees", hint: "Choose who's paid" },
  { label: "Preview", hint: "Check and adjust" },
  { label: "Confirm", hint: "Generate" },
] as const;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface WizardState {
  from: string;
  to: string;
  branchId: string;
  selected: string[];
  adjustments: Record<string, PayoutAdjustment[]>;
  overrides: Record<string, OverrideInput[]>;
  suggestionDecisions: Record<string, Record<string, Decision>>;
  deductionDecisions: Record<string, Decision>;
}

type Action =
  | { type: "range"; from: string; to: string }
  | { type: "branch"; branchId: string }
  | { type: "select"; ids: string[] }
  | { type: "remove"; id: string }
  | { type: "override"; id: string; field: OverrideField; value: number; reason: string }
  | { type: "resetOverride"; id: string; field: OverrideField }
  | { type: "resetAll"; id: string }
  | { type: "suggestion"; id: string; key: string; decision: Decision }
  | { type: "deduction"; deductionId: string; decision: Decision | "pending" }
  | { type: "adjustments"; id: string; adjustments: PayoutAdjustment[] };

const withoutKey = <T,>(record: Record<string, T>, key: string) => {
  const next = { ...record };
  delete next[key];
  return next;
};

/** Edits are tied to the period's numbers, so a new range starts clean. */
const clearedEdits = {
  selected: [],
  adjustments: {},
  overrides: {},
  suggestionDecisions: {},
  deductionDecisions: {},
};

const reducer = (state: WizardState, action: Action): WizardState => {
  switch (action.type) {
    case "range":
      return { ...state, ...clearedEdits, from: action.from, to: action.to };
    case "branch":
      return { ...state, branchId: action.branchId };
    case "select": {
      // Deselected employees lose their edits.
      const keep = new Set(action.ids);
      const prune = <T,>(r: Record<string, T>) =>
        Object.fromEntries(Object.entries(r).filter(([id]) => keep.has(id)));
      return {
        ...state,
        selected: action.ids,
        adjustments: prune(state.adjustments),
        overrides: prune(state.overrides),
        suggestionDecisions: prune(state.suggestionDecisions),
      };
    }
    case "remove":
      return reducer(state, {
        type: "select",
        ids: state.selected.filter((id) => id !== action.id),
      });
    case "override": {
      const list = (state.overrides[action.id] ?? []).filter((o) => o.field !== action.field);
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [action.id]: [...list, { field: action.field, value: action.value, reason: action.reason }],
        },
      };
    }
    case "resetOverride":
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [action.id]: (state.overrides[action.id] ?? []).filter((o) => o.field !== action.field),
        },
      };
    case "resetAll":
      return { ...state, overrides: withoutKey(state.overrides, action.id) };
    case "suggestion":
      return {
        ...state,
        suggestionDecisions: {
          ...state.suggestionDecisions,
          [action.id]: { ...(state.suggestionDecisions[action.id] ?? {}), [action.key]: action.decision },
        },
      };
    case "deduction":
      return {
        ...state,
        deductionDecisions:
          action.decision === "pending"
            ? withoutKey(state.deductionDecisions, action.deductionId)
            : { ...state.deductionDecisions, [action.deductionId]: action.decision },
      };
    case "adjustments":
      return {
        ...state,
        adjustments: { ...state.adjustments, [action.id]: action.adjustments },
      };
  }
};

const initialState = (): WizardState => ({
  ...monthRange(-1),
  branchId: "",
  ...clearedEdits,
});

const rangeDays = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;

const rangeError = (from: string, to: string) => {
  if (!from || !to) return "Choose a start and end date";
  if (from > to) return "The start date must be on or before the end date";
  if (to > todayInput()) return "The period can't include future dates";
  if (rangeDays(from, to) > MAX_RANGE_DAYS) return `A payout can cover at most ${MAX_RANGE_DAYS} days`;
  return null;
};

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------

const Stepper = ({ current, onGo }: { current: number; onGo: (step: number) => void }) => (
  <nav aria-label="Progress">
    <p className="sr-only">
      Step {current + 1} of {STEPS.length}: {STEPS[current]?.label}
    </p>
    <ol className="flex items-center gap-2 overflow-x-auto sm:gap-3">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const content = (
          <>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                active
                  ? "bg-primary text-on-primary"
                  : done
                    ? "bg-primary/15 text-primary"
                    : "border border-outline-variant/60 text-on-surface-variant"
              }`}
            >
              {done ? <span className="material-symbols-outlined text-base">check</span> : i + 1}
            </span>
            <span className="hidden text-left sm:block">
              <span className={`block text-xs font-bold ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
                {step.label}
              </span>
              <span className="block text-[11px] text-on-surface-variant/80">{step.hint}</span>
            </span>
          </>
        );
        return (
          <li key={step.label} className="flex min-w-0 items-center gap-2 sm:gap-3">
            {done ? (
              <button
                type="button"
                onClick={() => onGo(i)}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Back to ${step.label}`}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1" aria-current={active ? "step" : undefined}>
                {content}
              </div>
            )}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px w-6 shrink-0 sm:w-10 ${done ? "bg-primary/50" : "bg-outline-variant/50"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

/** Stays at the bottom of the viewport while the step's content scrolls. */
const ActionBar = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 z-10 -mx-1 mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
    {children}
  </div>
);

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm ${className}`}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const DateRangeStep = ({ state, dispatch }: { state: WizardState; dispatch: (a: Action) => void }) => {
  const { data: branches } = useBranchesQuery();
  const presets = [
    { label: "Last month", ...monthRange(-1) },
    { label: "This month so far", ...monthRange(0) },
  ];
  const error = rangeError(state.from, state.to);

  return (
    <Card className="mx-auto max-w-2xl p-5 sm:p-6">
      <h2 className="text-base font-bold text-on-surface">Which period is this payout for?</h2>
      <p className="mt-1 text-xs text-on-surface-variant">
        Up to {MAX_RANGE_DAYS} days, ending today at the latest. Attendance, leave and holidays in this period
        drive the calculation.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {presets.map((p) => {
          const active = state.from === p.from && state.to === p.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => dispatch({ type: "range", from: p.from, to: p.to })}
              aria-pressed={active}
              className={`rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/40 hover:bg-surface-container"
              }`}
            >
              <span className={`block text-sm font-bold ${active ? "text-primary" : "text-on-surface"}`}>{p.label}</span>
              <span className="block text-xs text-on-surface-variant">{formatPeriod(p.from, p.to)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-on-surface-variant">From</span>
          <input
            type="date"
            value={state.from}
            max={todayInput()}
            onChange={(e) => dispatch({ type: "range", from: e.target.value, to: state.to })}
            className={`${controlClass} w-full`}
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-on-surface-variant">To</span>
          <input
            type="date"
            value={state.to}
            max={todayInput()}
            onChange={(e) => dispatch({ type: "range", from: state.from, to: e.target.value })}
            className={`${controlClass} w-full`}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1.5">
        <span className="block text-xs font-medium text-on-surface-variant">Branch</span>
        <select
          value={state.branchId}
          onChange={(e) => dispatch({ type: "branch", branchId: e.target.value })}
          className={`${controlClass} w-full`}
        >
          <option value="">All branches</option>
          {(branches ?? []).map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <p className={`mt-4 text-xs ${error ? "font-semibold text-error" : "text-on-surface-variant"}`} role={error ? "alert" : undefined}>
        {error ?? `${rangeDays(state.from, state.to)} days selected.`}
      </p>
    </Card>
  );
};

const EmployeeSelectStep = ({ state, dispatch }: { state: WizardState; dispatch: (a: Action) => void }) => {
  const [search, setSearch] = useState("");
  const [showIneligible, setShowIneligible] = useState(false);
  const { data, isLoading, isError, error } = useEligibleEmployees(state.from, state.to, state.branchId || undefined);
  const employees = data ?? [];
  const selected = new Set(state.selected);
  const eligibleCount = employees.filter((e) => e.selectable).length;
  const ineligibleCount = employees.length - eligibleCount;

  const q = search.trim().toLowerCase();
  const filtered = employees.filter(
    (e) =>
      (showIneligible || e.selectable) &&
      (!q ||
        [e.name, e.email, e.employeeCode, e.designation, e.branch?.name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)))
  );
  const selectableFiltered = filtered.filter((e) => e.selectable);
  const allFilteredSelected =
    selectableFiltered.length > 0 && selectableFiltered.every((e) => selected.has(e._id));
  const someFilteredSelected = selectableFiltered.some((e) => selected.has(e._id));

  const toggleAll = () => {
    const ids = new Set(state.selected);
    for (const e of selectableFiltered) {
      if (allFilteredSelected) ids.delete(e._id);
      else ids.add(e._id);
    }
    dispatch({ type: "select", ids: [...ids] });
  };

  const toggle = (id: string) =>
    dispatch({
      type: "select",
      ids: selected.has(id) ? state.selected.filter((x) => x !== id) : [...state.selected, id],
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, branch…"
            aria-label="Search employees"
            className={`${controlClass} w-full pl-9`}
          />
        </div>
        {ineligibleCount > 0 && (
          <button
            type="button"
            onClick={() => setShowIneligible((v) => !v)}
            aria-pressed={showIneligible}
            className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
              showIneligible
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {showIneligible ? "Hide" : "Show"} {ineligibleCount} not eligible
          </button>
        )}
      </div>

      {!isLoading && !isError && eligibleCount === 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-800">
          <span className="material-symbols-outlined text-base">info</span>
          <span>
            No one is eligible for this period. Employees need a salary set on their profile (Employees → edit →
            Salary), must have joined by the end date, and can't already be in a payout for these dates.
          </span>
        </div>
      )}

      <Card className="overflow-hidden lg:overflow-visible">
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full border-collapse text-left">
            <thead className="lg:sticky lg:top-16 lg:z-[5]">
              <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant/80">
                <th className="w-12 py-2.5 pl-4">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected;
                    }}
                    onChange={toggleAll}
                    disabled={selectableFiltered.length === 0}
                    aria-label="Select all shown employees"
                    className="h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="hidden py-2.5 px-3 md:table-cell">Designation</th>
                <th className="py-2.5 px-4 text-right">Monthly gross</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-2.5 px-4">
                      <div className="h-8 rounded-lg bg-surface-container-high animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-error">
                    {getErrorMessage(error, "Failed to load employees")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-on-surface-variant">
                    {q ? "No employees match your search." : "No eligible employees."}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const checked = selected.has(e._id);
                  return (
                    <tr
                      key={e._id}
                      onClick={() => e.selectable && toggle(e._id)}
                      className={
                        e.selectable
                          ? `cursor-pointer transition-colors ${checked ? "bg-primary/5" : "hover:bg-surface-container-low/60"}`
                          : "bg-surface-container-low/30"
                      }
                    >
                      <td className="py-2.5 pl-4" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!e.selectable}
                          onChange={() => toggle(e._id)}
                          aria-label={`Select ${e.name}`}
                          className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <p className={`font-bold ${e.selectable ? "" : "text-on-surface-variant"}`}>{e.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {[e.employeeCode, e.role].filter(Boolean).join(" · ")}
                          {e.disabledReason && (
                            <span className="ml-1.5 font-semibold text-amber-700">· {e.disabledReason}</span>
                          )}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{e.branch?.name ?? "—"}</td>
                      <td className="hidden py-2.5 px-3 text-on-surface-variant md:table-cell">{e.designation ?? "—"}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{e.hasSalary ? inr(e.grossSalary) : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const SummaryPanel = ({ data, stale }: { data: PayoutPreview; stale: boolean }) => {
  const edited = data.lines.filter((l) => l.overrides.length > 0).length;
  const pending = data.lines.reduce(
    (n, l) => n + l.manualDeductions.filter((d) => d.decision === "pending").length,
    0
  );
  const warnings = data.lines.filter((l) => l.warnings.length > 0).length;

  const stats = [
    { label: "Employees", value: String(data.totals.employees) },
    { label: "Gross", value: inr(data.totals.gross) },
    { label: "Deductions", value: inr(data.totals.deductions) },
    ...(data.totals.adjustments !== 0 ? [{ label: "Adjustments", value: inr(data.totals.adjustments) }] : []),
    { label: "Net payout", value: inr(data.totals.net), strong: true },
  ];

  return (
    <Card className="p-4">
      <dl className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 transition-opacity ${stale ? "opacity-50" : ""}`}>
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">{s.label}</dt>
            <dd className={`truncate tabular-nums text-on-surface ${"strong" in s && s.strong ? "text-xl font-extrabold text-primary" : "text-lg font-bold"}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-outline-variant/20 pt-3 text-[11px] text-on-surface-variant">
        <li className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-primary">rule</span>
          {data.settings.isDefault ? "Default rules: only half days and absences are deducted" : "Using saved salary rules"}
        </li>
        {edited > 0 && (
          <li className="flex items-center gap-1 text-amber-800">
            <span className="material-symbols-outlined text-sm">edit</span>
            {edited} employee{edited === 1 ? " has" : "s have"} manual edits
          </li>
        )}
        {pending > 0 && (
          <li className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">pending</span>
            {pending} recorded deduction{pending === 1 ? "" : "s"} left pending
          </li>
        )}
        {warnings > 0 && (
          <li className="flex items-center gap-1 text-amber-800">
            <span className="material-symbols-outlined text-sm">warning</span>
            {warnings} row{warnings === 1 ? "" : "s"} with warnings (expand to see)
          </li>
        )}
      </ul>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const GeneratePayoutPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [reviewed, setReviewed] = useState(false);
  const generate = useGeneratePayout();
  const leavingOnPurpose = useRef(false);

  const requestedStep = Math.min(Math.max(Number(params.get("step") ?? 1) - 1, 0), STEPS.length - 1);

  const input: PayoutInput = useMemo(
    () => ({
      from: state.from,
      to: state.to,
      employeeIds: state.selected,
      adjustments: state.adjustments,
      overrides: state.overrides,
      suggestionDecisions: state.suggestionDecisions,
      deductionDecisions: state.deductionDecisions,
    }),
    [state]
  );

  // Edits re-run the preview, but not on every keystroke.
  const debouncedInput = useDebounced(input, 350);
  const preview = usePayoutPreview(requestedStep >= 2 ? debouncedInput : null);
  const previewStale = debouncedInput !== input || preview.isFetching;
  const data = preview.data;
  const lines = data?.lines ?? [];

  // Leaving the page with work in progress asks first (tab close and in-app links).
  const dirty = state.selected.length > 0;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leavingOnPurpose.current && currentLocation.pathname !== nextLocation.pathname
  );
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [requestedStep]);

  // A reload or a hand-edited URL can land on a step whose inputs are gone.
  let allowedStep = requestedStep;
  if (allowedStep >= 1 && rangeError(state.from, state.to)) allowedStep = 0;
  else if (allowedStep >= 2 && state.selected.length === 0) allowedStep = 1;
  if (allowedStep !== requestedStep) {
    return <Navigate to={`?step=${allowedStep + 1}`} replace />;
  }
  const step = requestedStep;

  // Steps are history entries, so the browser back button moves between them.
  const goTo = (next: number) => {
    setReviewed(false);
    setParams({ step: String(next + 1) });
  };

  const editHandlers = (id: string): BreakdownEditHandlers => ({
    onOverride: (field, value, reason) => dispatch({ type: "override", id, field, value, reason }),
    onResetOverride: (field) => dispatch({ type: "resetOverride", id, field }),
    onResetAll: () => dispatch({ type: "resetAll", id }),
    onSuggestionDecision: (key, decision) => dispatch({ type: "suggestion", id, key, decision }),
    onDeductionDecision: (deductionId, decision) => dispatch({ type: "deduction", deductionId, decision }),
    onAdjustmentsChange: (adjustments) => dispatch({ type: "adjustments", id, adjustments }),
  });

  const overrides = lines.flatMap((l) => l.overrides.map((o) => ({ ...o, name: l.name })));
  const overrideNetChange = lines.reduce((s, l) => s + (l.net - l.calculatedNet), 0);
  const decisionCounts = lines.reduce(
    (acc, l) => {
      for (const d of l.manualDeductions) {
        if (d.status !== "pending") continue;
        if (d.decision === "approved") acc.approve++;
        else if (d.decision === "rejected") acc.reject++;
        else acc.pending++;
      }
      for (const s of l.suggestions) if (s.decision === "rejected") acc.waived++;
      return acc;
    },
    { approve: 0, reject: 0, pending: 0, waived: 0 }
  );

  const canNext =
    (step === 0 && !rangeError(state.from, state.to)) ||
    (step === 1 && state.selected.length > 0) ||
    (step === 2 && !!data && !preview.isError && !previewStale && lines.length > 0);

  const handleGenerate = () => {
    generate.mutate(input, {
      onSuccess: (response) => {
        leavingOnPurpose.current = true;
        navigate(ROUTES.payoutDetail.replace(":id", response.data._id), { replace: true });
      },
    });
  };

  const backButton = step > 0 && (
    <button
      type="button"
      onClick={() => goTo(step - 1)}
      disabled={generate.isPending}
      className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
    >
      Back
    </button>
  );

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="space-y-5 border-b border-outline-variant/30 pb-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Link to={`${ROUTES.salary}?view=payouts`} className="font-bold hover:text-primary">
            Salary
          </Link>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
          <span>Generate payout</span>
        </nav>
        <div>
          <h1 className="font-headline-md text-2xl font-extrabold text-on-surface sm:text-3xl">Generate payout</h1>
          <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
            {formatPeriod(state.from, state.to)}
            {state.selected.length > 0 && ` · ${state.selected.length} employee${state.selected.length === 1 ? "" : "s"} selected`}
          </p>
        </div>
        <Stepper current={step} onGo={goTo} />
      </div>

      <div className="pt-6">
        {step === 0 && (
          <div className="mx-auto max-w-2xl">
            <DateRangeStep state={state} dispatch={dispatch} />
            <ActionBar>
              <Link to={`${ROUTES.salary}?view=payouts`} className="rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container">
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => goTo(1)}
                disabled={!canNext}
                className="ml-auto rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
              >
                Next: choose employees
              </button>
            </ActionBar>
          </div>
        )}

        {step === 1 && (
          <>
            <EmployeeSelectStep state={state} dispatch={dispatch} />
            <ActionBar>
              <p className="text-xs text-on-surface-variant">
                <b className="text-on-surface">{state.selected.length}</b> selected
              </p>
              <div className="ml-auto flex gap-2">
                {backButton}
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  disabled={!canNext}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
                >
                  Next: preview
                </button>
              </div>
            </ActionBar>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3">
              {data && !preview.isError && <SummaryPanel data={data} stale={previewStale} />}
              <div className="min-w-0 space-y-3">
                <p className="text-xs text-on-surface-variant">
                  Expand a row to see the breakdown. Every amount can be edited (a reason is required). Edits,
                  adjustments and deduction decisions are saved when you generate.
                </p>
                {preview.isError ? (
                  <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-6 text-center text-xs text-error" role="alert">
                    {getErrorMessage(preview.error, "Failed to build the preview")}
                  </div>
                ) : !data ? (
                  <div className="h-64 rounded-2xl bg-surface-container-high animate-pulse" />
                ) : lines.length === 0 ? (
                  <p className="py-10 text-center text-xs text-on-surface-variant">
                    No employees left in this payout. Go back and select some.
                  </p>
                ) : (
                  <div className={`transition-opacity ${previewStale ? "opacity-60" : ""}`}>
                    <PayoutLinesTable
                      lines={lines}
                      totals={data.totals}
                      editHandlers={editHandlers}
                      onRemove={(id) => dispatch({ type: "remove", id })}
                    />
                  </div>
                )}
              </div>
            </div>
            <ActionBar>
              {data && (
                <p className="text-xs text-on-surface-variant">
                  Net <b className="text-on-surface">{inr(data.totals.net)}</b>
                </p>
              )}
              {previewStale && (
                <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Updating…
                </p>
              )}
              <div className="ml-auto flex gap-2">
                {backButton}
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  disabled={!canNext}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
                >
                  Next: review & confirm
                </button>
              </div>
            </ActionBar>
          </>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-2xl space-y-4">
            {!data ? (
              <div className="h-48 rounded-2xl bg-surface-container-high animate-pulse" />
            ) : (
              <>
                <Card className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">You're about to pay</p>
                  <p className="text-3xl font-extrabold tabular-nums text-on-surface">{inr(data.totals.net)}</p>
                  <p className="text-xs text-on-surface-variant">
                    to {data.totals.employees} employee{data.totals.employees === 1 ? "" : "s"} for {formatPeriod(data.from, data.to)}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant/20 pt-4 text-xs sm:grid-cols-3">
                    <div><dt className="text-on-surface-variant">Gross</dt><dd className="font-bold tabular-nums">{inr(data.totals.gross)}</dd></div>
                    <div><dt className="text-on-surface-variant">Deductions</dt><dd className="font-bold tabular-nums">{inr(data.totals.deductions)}</dd></div>
                    <div><dt className="text-on-surface-variant">Adjustments</dt><dd className="font-bold tabular-nums">{inr(data.totals.adjustments)}</dd></div>
                  </dl>
                </Card>

                <Card className="p-5">
                  <ul className="space-y-2 text-xs">
                    <li>Rules: <b>{data.settings.isDefault ? "Default (half days and absences only)" : "Saved salary rules"}</b></li>
                    {(decisionCounts.approve > 0 || decisionCounts.reject > 0) && (
                      <li>
                        Recorded deductions: <b>{decisionCounts.approve} will be approved</b>, <b>{decisionCounts.reject} rejected</b>
                        {decisionCounts.pending > 0 && `, ${decisionCounts.pending} stay pending`}
                      </li>
                    )}
                    {decisionCounts.approve === 0 && decisionCounts.reject === 0 && decisionCounts.pending > 0 && (
                      <li>{decisionCounts.pending} recorded deduction(s) stay pending</li>
                    )}
                    {decisionCounts.waived > 0 && <li>System suggestions waived: <b>{decisionCounts.waived}</b></li>}
                    {overrides.length === 0 && <li>No amounts were edited manually.</li>}
                  </ul>
                </Card>

                {overrides.length > 0 && (
                  <details className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-xs" open>
                    <summary className="cursor-pointer font-bold text-amber-800">
                      {overrides.length} amount{overrides.length === 1 ? "" : "s"} edited manually (net change{" "}
                      {overrideNetChange >= 0 ? "+" : "−"}
                      {inr(Math.abs(overrideNetChange))})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {overrides.map((o) => (
                        <li key={`${o.name}-${o.field}`}>
                          <b>{o.name}</b> · {o.field}: {inr(o.calculated)} → {inr(o.value)}{" "}
                          <span className="text-on-surface-variant">({o.reason})</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}

            <ActionBar>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="h-4 w-4" />
                I've reviewed the figures
              </label>
              <div className="ml-auto flex gap-2">
                {backButton}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!reviewed || !data || generate.isPending || previewStale}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm disabled:opacity-40"
                >
                  {generate.isPending && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                  Generate payout
                </button>
              </div>
            </ActionBar>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Leave without generating?"
        description="Your selections and edits for this payout will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        tone="danger"
      />
    </div>
  );
};

export default GeneratePayoutPage;
