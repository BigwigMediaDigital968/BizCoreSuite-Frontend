import { useEffect, useState } from "react";
import {
  useBranchAttendanceConfig,
  useUpdateBranchAttendanceConfig,
} from "../hooks/useBranches";
import type { BranchAttendanceConfig } from "@/types/branch";

interface BranchAttendanceConfigFormProps {
  branchId: string;
  branchIsActive: boolean;
}

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const BranchAttendanceConfigForm = ({
  branchId,
  branchIsActive,
}: BranchAttendanceConfigFormProps) => {
  const { data, isLoading } = useBranchAttendanceConfig(branchId);
  const updateConfig = useUpdateBranchAttendanceConfig();

  const [form, setForm] = useState<BranchAttendanceConfig | null>(null);

  // Prefill once fetched. This tab is only mounted after the branch exists,
  // so the fetch always has a real id to work with.
  useEffect(() => {
    if (data?.attendanceConfig) {
      setForm(data.attendanceConfig);
    }
  }, [data]);

  const toggleDay = (day: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const workingDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day].sort((a, b) => a - b);
      return { ...prev, workingDays };
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              location: {
                ...prev.location,
                latitude: Number(position.coords.latitude.toFixed(6)),
                longitude: Number(position.coords.longitude.toFixed(6)),
              },
            }
          : prev
      );
    });
  };

  const handleSave = async () => {
    if (!form) return;
    await updateConfig.mutateAsync({
      id: branchId,
      payload: {
        enabled: form.enabled,
        timezone: form.timezone,
        location: form.location,
        workingDays: form.workingDays,
        workingHours: form.workingHours,
        gracePeriodMinutes: form.gracePeriodMinutes,
      },
    });
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-11 rounded-xl bg-surface-container-high animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!branchIsActive) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <span className="material-symbols-outlined text-amber-600">
          info
        </span>
        <p className="font-body-sm text-xs text-amber-800">
          This branch is deactivated. Reactivate it from the branch list to
          change attendance settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Enabled toggle */}
      <div
        onClick={() =>
          setForm((prev) =>
            prev ? { ...prev, enabled: !prev.enabled } : prev
          )
        }
        className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
          form.enabled
            ? "border-outline-variant/30 bg-surface-container-low"
            : "border-outline-variant/30 bg-surface-container-low opacity-70"
        }`}
      >
        <div>
          <p className="font-label-md text-xs font-bold text-on-surface">
            Attendance Tracking: {form.enabled ? "Enabled" : "Disabled"}
          </p>
          <p className="font-body-sm text-[11px] text-on-surface-variant/70">
            Turn off if this branch doesn't track geofenced check-ins yet.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.enabled}
          onClick={(e) => {
            e.stopPropagation();
            setForm((prev) =>
              prev ? { ...prev, enabled: !prev.enabled } : prev
            );
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            form.enabled ? "bg-emerald-600" : "bg-outline-variant/60"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
              form.enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <label className="block font-label-md text-xs font-medium text-on-surface-variant">
          Timezone
        </label>
        <input
          type="text"
          value={form.timezone}
          placeholder="Asia/Kolkata"
          onChange={(e) =>
            setForm((prev) =>
              prev ? { ...prev, timezone: e.target.value } : prev
            )
          }
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            Geofence Location
          </label>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="flex items-center gap-1 font-label-sm text-[11px] font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-sm">
              my_location
            </span>
            Use my current location
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <span className="block font-body-sm text-[11px] text-on-surface-variant/70">
              Latitude
            </span>
            <input
              type="number"
              step="any"
              value={form.location.latitude}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        location: {
                          ...prev.location,
                          latitude: Number(e.target.value),
                        },
                      }
                    : prev
                )
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <span className="block font-body-sm text-[11px] text-on-surface-variant/70">
              Longitude
            </span>
            <input
              type="number"
              step="any"
              value={form.location.longitude}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        location: {
                          ...prev.location,
                          longitude: Number(e.target.value),
                        },
                      }
                    : prev
                )
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <span className="block font-body-sm text-[11px] text-on-surface-variant/70">
              Radius (m)
            </span>
            <input
              type="number"
              min={10}
              max={5000}
              value={form.location.radiusMeters}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        location: {
                          ...prev.location,
                          radiusMeters: Number(e.target.value),
                        },
                      }
                    : prev
                )
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Working days */}
      <div className="space-y-2">
        <label className="block font-label-md text-xs font-medium text-on-surface-variant">
          Working Days
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const isSelected = form.workingDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-lg px-3.5 py-2 font-label-sm text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Working hours + grace period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            Start Time
          </label>
          <input
            type="time"
            value={form.workingHours.startTime}
            onChange={(e) =>
              setForm((prev) =>
                prev
                  ? {
                      ...prev,
                      workingHours: {
                        ...prev.workingHours,
                        startTime: e.target.value,
                      },
                    }
                  : prev
              )
            }
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            End Time
          </label>
          <input
            type="time"
            value={form.workingHours.endTime}
            onChange={(e) =>
              setForm((prev) =>
                prev
                  ? {
                      ...prev,
                      workingHours: {
                        ...prev.workingHours,
                        endTime: e.target.value,
                      },
                    }
                  : prev
              )
            }
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block font-label-md text-xs font-medium text-on-surface-variant">
            Grace Period (min)
          </label>
          <input
            type="number"
            min={0}
            max={180}
            value={form.gracePeriodMinutes}
            onChange={(e) =>
              setForm((prev) =>
                prev
                  ? { ...prev, gracePeriodMinutes: Number(e.target.value) }
                  : prev
              )
            }
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          <span className="material-symbols-outlined text-base">
            {updateConfig.isPending ? "sync" : "save"}
          </span>
          <span>
            {updateConfig.isPending ? "Saving…" : "Save Attendance Settings"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BranchAttendanceConfigForm;