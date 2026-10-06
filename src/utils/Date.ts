/** Formats a Date as YYYY-MM-DD (the format the backend expects for attendance queries). */
export const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayInput = (): string => toDateInput(new Date());

export const daysAgoInput = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateInput(d);
};

export const formatTime = (iso?: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (value: string): string => {
  // `date` field on attendance records is a plain YYYY-MM-DD string, not a
  // full ISO timestamp — parse it as local to avoid a timezone off-by-one.
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatMinutes = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};