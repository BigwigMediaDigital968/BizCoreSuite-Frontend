import { useState } from "react";

import RefreshButton from "@/components/ui/RefreshButton";
import SubmittedReportsTab from "../components/SubmittedReportsTab";
import MissingReportsTab from "../components/MissingReportsTab";
import SummaryTab from "../components/SummaryTab";
import { dailyReportKeys } from "../hooks/useDailyReports";

const TABS = [
  { id: "submitted", label: "Submitted", icon: "assignment_turned_in" },
  { id: "missing", label: "Missing", icon: "assignment_late" },
  { id: "summary", label: "Summary", icon: "leaderboard" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DailyReportsReviewPage = () => {
  const [tab, setTab] = useState<TabId>("submitted");

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Daily Reports</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Team Reports
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Review end-of-day reports, see who hasn't submitted, and compare
            reported figures against the dialer and revenue records.
          </p>
        </div>

        <RefreshButton
          queryKey={dailyReportKeys.all}
          className="self-start md:self-auto shrink-0"
        />
      </div>

      <div
        role="tablist"
        aria-label="Daily report views"
        className="flex gap-1 overflow-x-auto border-b border-outline-variant/30"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 font-label-md text-xs font-bold transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "submitted" && <SubmittedReportsTab />}
      {tab === "missing" && <MissingReportsTab />}
      {tab === "summary" && <SummaryTab />}
    </div>
  );
};

export default DailyReportsReviewPage;
