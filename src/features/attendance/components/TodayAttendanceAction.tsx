import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/auth.store";
import { useBranch } from "@/features/branches";
import { useAttendanceRecords, useCheckIn, useCheckOut } from "../hooks/useAttendance";
import { getAttendanceErrorMessage, getCurrentAttendanceLocation, type WorkMode } from "@/services/attendanceLocation";
import { todayInput } from "@/utils/Date";

/**
 * Standalone action terminal for today's attendance.
 *
 * Fetches its own (today-only) record so it is independent from the
 * monthly paginated list used by the table below. This avoids the
 * "today" row disappearing when the table is paginated to other pages,
 * and keeps the check-in / check-out state untouched by table refetches.
 */
const TodayAttendanceAction = () => {
    const user = useAuthStore((state) => state.user);
    const { data: branch } = useBranch(user?.branches[0]);

    const today = todayInput();

    // Dedicated query for today's record only.
    const {
        data: todayData,
        isLoading,
        isFetching,
    } = useAttendanceRecords({
        date: today,
        employeeId: user?._id,
        page: 1,
        limit: 1,
    });

    const todaysRecord = todayData?.records?.[0];

    // Mutators for Punch In / Out
    const checkInMutation = useCheckIn();
    const checkOutMutation = useCheckOut();

    const isCheckedIn = Boolean(todaysRecord?.checkInAt && !todaysRecord?.checkOutAt);
    const isCheckedOut = Boolean(todaysRecord?.checkOutAt);

    // Work mode + auto-detection state
    const [workMode, setWorkMode] = useState<WorkMode>("WFH");
    const [autoDetectedMode, setAutoDetectedMode] = useState<WorkMode | null>(null);
    const [isAutoDetected, setIsAutoDetected] = useState(false);

    const [isClickLoading, setClickLoading] = useState(false);

    useEffect(() => {
        if (branch?.attendanceConfig?.location) {
            detectWorkMode();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branch]);

    const detectWorkMode = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            setIsAutoDetected(false);
            return;
        }

        const branchLat = branch?.attendanceConfig?.location?.latitude;
        const branchLng = branch?.attendanceConfig?.location?.longitude;
        const radius = branch?.attendanceConfig?.location?.radiusMeters || 200;

        if (branchLat == null || branchLng == null) {
            setIsAutoDetected(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const distance = haversineMeters(latitude, longitude, branchLat, branchLng);
                const detected: WorkMode = distance <= radius ? "WFO" : "WFH";

                setAutoDetectedMode(detected);
                setWorkMode(detected);
                setIsAutoDetected(true);
            },
            (error) => {
                console.error("Location detection failed:", error);
                setIsAutoDetected(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handlePunchAction = async () => {
        if (checkInMutation.isPending || checkOutMutation.isPending) return;

        try {
            setClickLoading(true);

            const location = await getCurrentAttendanceLocation({
                latitude: branch?.attendanceConfig?.location?.latitude,
                longitude: branch?.attendanceConfig?.location?.longitude,
                radiusMeters: branch?.attendanceConfig?.location?.radiusMeters ?? 200,
            });

            const payload = {
                latitude: location.latitude,
                longitude: location.longitude,
                workMode,
            };

            if (isCheckedIn) {
                checkOutMutation.mutate(payload, {
                    onSuccess: () => toast.success("Check-out successful"),
                    onError: (error) => toast.error(getAttendanceErrorMessage(error)),
                });
                return;
            }

            checkInMutation.mutate(payload, {
                onSuccess: () => toast.success("Check-in successful"),
                onError: (error) => toast.error(getAttendanceErrorMessage(error)),
            });
        } catch (error: any) {
            if (error instanceof Error) {
                toast.error(error.message);
                return;
            }
            toast.error("Unable to determine your location. Please try again.");
        } finally{
            setClickLoading(false);
        }
    };

    const formatClock = (iso?: string) =>
        iso
            ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "--:--";

    return (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Terminal Meta Details */}
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isCheckedIn
                                ? "bg-emerald-500/10 text-emerald-700"
                                : isCheckedOut
                                    ? "bg-sky-500/10 text-sky-700"
                                    : "bg-error/10 text-error"
                                }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${isCheckedIn
                                    ? "bg-emerald-500 animate-pulse"
                                    : isCheckedOut
                                        ? "bg-sky-500"
                                        : "bg-error"
                                    }`}
                            />
                            {isCheckedIn
                                ? "Clocked In & Active"
                                : isCheckedOut
                                    ? "Shift Completed"
                                    : "Not Checked In Yet"}
                        </span>

                        <span className="font-label-sm text-xs font-semibold text-on-surface-variant">
                            • Shift: {branch?.attendanceConfig?.workingHours?.startTime || "09:00"} -{" "}
                            {branch?.attendanceConfig?.workingHours?.endTime || "18:00"}
                        </span>
                    </div>

                    <h2 className="font-headline-sm text-2xl font-bold text-on-surface">
                        {isCheckedOut
                            ? "Great work today!"
                            : isCheckedIn
                                ? "You are currently on duty"
                                : "Ready to start your work day?"}
                    </h2>

                    <p className="font-body-sm text-xs text-on-surface-variant">
                        {todaysRecord?.checkInAt
                            ? `Checked in at ${formatClock(todaysRecord.checkInAt)}`
                            : "Work mode auto-detects based on location. You can manually toggle override before punch-in."}
                    </p>

                    {/* Work Mode Toggle Pill (WFH vs WFO) */}
                    {!isCheckedIn && !isCheckedOut && (
                        <div className="pt-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                                    Work Mode:
                                </span>
                                {isAutoDetected && autoDetectedMode && (
                                    <span className="text-[10px] font-semibold text-emerald-600">
                                        Auto detected: {autoDetectedMode === "WFO" ? "Office" : "Home"}
                                    </span>
                                )}
                            </div>

                            <div className="inline-flex rounded-xl bg-surface-container-low p-1 border border-outline-variant/30">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWorkMode("WFO");
                                        setIsAutoDetected(false);
                                    }}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${workMode === "WFO"
                                        ? "bg-surface-container-lowest text-primary shadow-sm"
                                        : "text-on-surface-variant hover:text-on-surface"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm">corporate_fare</span>
                                    Office (WFO)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWorkMode("WFH");
                                        setIsAutoDetected(false);
                                    }}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${workMode === "WFH"
                                        ? "bg-surface-container-lowest text-primary shadow-sm"
                                        : "text-on-surface-variant hover:text-on-surface"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm">home_work</span>
                                    Home (WFH)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="w-full lg:w-auto">
                    <button
                        type="button"
                        disabled={
                            checkInMutation.isPending ||
                            checkOutMutation.isPending ||
                            isCheckedOut ||
                            isLoading || isClickLoading
                        }
                        onClick={handlePunchAction}
                        className={`w-full lg:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-label-md text-xs font-bold transition-all shadow-sm ${isCheckedOut
                            ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                            : isCheckedIn
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-primary hover:bg-primary/90 text-white"
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isCheckedOut ? "verified" : isCheckedIn ? "logout" : "fingerprint"}
                        </span>
                        <span>
                            { isClickLoading || checkInMutation.isPending || checkOutMutation.isPending
                                ? "Verifying Location..."
                                : isCheckedOut
                                    ? "Day Completed"
                                    : isCheckedIn
                                        ? "Check Out Now"
                                        : `Check In (${workMode})`}
                        </span>
                    </button>
                    {isFetching && !isLoading && (
                        <p className="mt-2 text-[10px] text-on-surface-variant text-right">
                            Refreshing today…
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-outline-variant/20">
                <div>
                    <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                        Check In Time
                    </p>
                    <p className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                        {formatClock(todaysRecord?.checkInAt)}
                    </p>
                </div>
                <div>
                    <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                        Check Out Time
                    </p>
                    <p className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                        {formatClock(todaysRecord?.checkOutAt)}
                    </p>
                </div>
                <div>
                    <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                        Work Mode
                    </p>
                    <p className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                        {todaysRecord?.workMode ? todaysRecord.workMode.toUpperCase() : workMode}
                    </p>
                </div>
                <div>
                    <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                        Status
                    </p>
                    <p className="font-label-md text-sm font-bold text-emerald-600 mt-0.5 capitalize">
                        {todaysRecord?.status || "Pending"}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Haversine in meters (local helper, kept private to this component).
const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default TodayAttendanceAction;
