import { useSearchParams } from "react-router";

import RefreshButton from "@/components/ui/RefreshButton";
import PayoutList from "../components/salary/PayoutList";
import DeductionsPanel from "../components/salary/DeductionsPanel";
import SalaryRulesForm from "../components/salary/SalaryRulesForm";
import { salaryKeys } from "../hooks/useSalary";

const SALARY_VIEWS = [
  { id: "payouts", label: "Payouts", icon: "receipt_long" },
  { id: "deductions", label: "Deductions", icon: "remove_circle" },
  { id: "rules", label: "Salary Rules", icon: "rule" },
] as const;

type SalaryView = (typeof SALARY_VIEWS)[number]["id"];

const SalaryPage = () => {
  const [params, setParams] = useSearchParams();
  const view: SalaryView =
    SALARY_VIEWS.find((v) => v.id === params.get("view"))?.id ?? "payouts";

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>System</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Salary
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Generate salary payouts from attendance, leave and approved deductions, and set the rules
            they follow.
          </p>
        </div>
        <RefreshButton queryKey={salaryKeys.all} className="self-start md:self-auto shrink-0" />
      </div>

      <div role="tablist" aria-label="Salary views" className="flex gap-1 overflow-x-auto">
        {SALARY_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setParams({ view: v.id }, { replace: true })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
              view === v.id
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {view === "payouts" && <PayoutList />}
      {view === "deductions" && <DeductionsPanel />}
      {view === "rules" && <SalaryRulesForm />}
    </div>
  );
};

export default SalaryPage;
