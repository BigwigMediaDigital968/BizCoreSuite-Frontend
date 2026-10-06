import { useState } from "react";
import toast from "react-hot-toast";

import { Can } from "@/components/Auth/Can";
import { PERMISSIONS } from "@/types/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  REPORT_MODULES,
  REPORT_MODULE_LABELS,
  reportApi,
  type DashboardReportFilters,
  type ReportFormat,
  type ReportModule,
} from "@/services/reportApi";

interface ExportReportButtonProps {
  /** Date/branch scope to export; defaults to the caller's full scope. */
  filters?: DashboardReportFilters;
}

const ExportReportButton = ({ filters = {} }: ExportReportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [module, setModule] = useState<ReportModule>(REPORT_MODULES.ALL);
  const [format, setFormat] = useState<ReportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await reportApi.exportReport({
        ...filters,
        module,
        format,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setIsOpen(false);
      toast.success("Report downloaded");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to export report"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Can permission={PERMISSIONS.REPORT_EXPORT}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Export</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 z-20 mt-2 w-64 space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-lg">
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                  Module
                </label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value as ReportModule)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                >
                  {Object.values(REPORT_MODULES).map((value) => (
                    <option key={value} value={value}>
                      {REPORT_MODULE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                  Format
                </label>
                <div className="flex rounded-lg bg-surface-container-low p-1">
                  {(["csv", "excel"] as ReportFormat[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormat(value)}
                      className={`flex-1 rounded-md px-3 py-1.5 font-label-sm text-xs font-bold transition-all ${
                        format === value
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {value === "csv" ? "CSV" : "Excel"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full rounded-lg bg-primary px-4 py-2 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isExporting ? "Preparing…" : "Download"}
              </button>
            </div>
          </>
        )}
      </div>
    </Can>
  );
};

export default ExportReportButton;
