import { ROLE_LABELS, type Role } from "@/types/auth";
import type { ChatRoom } from "@/types/chat";

export const roomTitle = (room: ChatRoom) =>
  room.type === "DIRECT"
    ? room.otherUser?.name || "Unknown user"
    : room.name || "General";

export const initials = (name?: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

export const roleLabel = (role?: string) =>
  (role && ROLE_LABELS[role as Role]) || role || "";

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const DAY_MS = 24 * 60 * 60 * 1000;

export const isSameDay = (a: string, b: string) =>
  startOfDay(new Date(a)) === startOfDay(new Date(b));

/** "Today", "Yesterday", or a date — for separators between days. */
export const dayLabel = (iso: string) => {
  const diff = (startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString([], {
    weekday: diff < 7 ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: diff > 300 ? "numeric" : undefined,
  });
};

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Compact time for the room list: time today, else "Yesterday" or a date. */
export const listTimeLabel = (iso: string) => {
  const diff = (startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS;
  if (diff === 0) return timeLabel(iso);
  if (diff === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
};
