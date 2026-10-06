import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getErrorMessage } from "@/utils/getErrorMessage";
import { formatDate } from "@/utils/Date";
import { salaryApi } from "@/services/salaryApi";
import type { ExportFormat, SalaryPayoutStatus } from "@/types/salary";

export const inr = (value: number | null | undefined) =>
  `₹${(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/** Day counts can be halves; show "2.5", not "2.50". */
export const days = (value: number | null | undefined) =>
  String(Math.round((value ?? 0) * 100) / 100);

export const formatPeriod = (from: string, to: string) =>
  `${formatDate(from)} – ${formatDate(to)}`;

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const controlClass =
  "rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary";

export const PAYOUT_STATUS_STYLES: Record<
  SalaryPayoutStatus,
  { label: string; className: string }
> = {
  generated: { label: "Generated", className: "bg-primary/10 text-primary" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600" },
  cancelled: {
    label: "Cancelled",
    className: "bg-on-surface-variant/10 text-on-surface-variant",
  },
};

/** How a payout's status reads to the employee being paid. */
export const MY_STATUS = {
  generated: { label: "Processing", className: "bg-primary/10 text-primary", icon: "hourglass_top" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-700", icon: "task_alt" },
} as const;

export const useDebounced = <T,>(value: T, delayMs = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

export const downloadPayout = async (id: string, format: ExportFormat) => {
  try {
    const { blob, filename } = await salaryApi.exportPayout(id, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Payout downloaded");
  } catch (error) {
    toast.error(getErrorMessage(error, "Failed to export payout"));
  }
};

/** First and last day of a month offset from the current one, capped at today. */
export const monthRange = (offset: number) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const cap = end > now ? now : end;
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { from: fmt(start), to: fmt(cap) };
};
