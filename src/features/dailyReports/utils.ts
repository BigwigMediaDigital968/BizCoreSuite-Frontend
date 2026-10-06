import { useEffect, useState } from "react";

/**
 * Current time corrected by the server's clock, ticking every `intervalMs`.
 * The window is enforced server-side, so the countdown must not trust a
 * device clock that may be minutes off.
 */
export const useServerNow = (clockOffsetMs = 0, intervalMs = 1000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now + clockOffsetMs;
};

export const filterControlClass =
  "rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary";

export const formatRemaining = (ms: number): string => {
  if (ms <= 0) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m >= 5) return `${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

export const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const DRAFT_PREFIX = "daily-report-draft";

export const draftStorageKey = (userId: string, date: string) =>
  `${DRAFT_PREFIX}:${userId}:${date}`;

// Storage can be unavailable (private mode, blocked site data): drafts are a
// convenience, so every access fails soft.
export const readDraft = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const writeDraft = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const clearDraft = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};
