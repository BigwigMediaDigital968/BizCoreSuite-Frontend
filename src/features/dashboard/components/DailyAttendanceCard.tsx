import { useCheckIn, useCheckOut } from '@/features/attendance/hooks/useAttendance';
import { getAttendanceErrorMessage } from '@/services/attendanceLocation';
import type { AttendanceRecord, AttendanceWorkMode } from '@/types/attendance';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export type WorkMode = AttendanceWorkMode;

export interface LocationPayload {
    mode: WorkMode;
    latitude: number;
    longitude: number;
}

export interface DailyAttendanceCardProps {
    attendanceData?: AttendanceRecord | null;
    isAttendanceLoading?: boolean;
    className?: string;
}

interface PositionCoords {
    latitude: number;
    longitude: number;
    accuracy: number;
}

const getCurrentLocation = (): Promise<PositionCoords> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                return resolve({
                    latitude,
                    longitude,
                    accuracy,
                });
            },
            (error: GeolocationPositionError) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('Location permission denied. Please enable GPS.'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('Location info unavailable.'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('Location request timed out.'));
                        break;
                    default:
                        reject(new Error('An error occurred getting location.'));
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
};

export function DailyAttendanceCard({
    attendanceData,
    isAttendanceLoading = false,
    className = '',
}: DailyAttendanceCardProps) {
    const [workMode, setWorkMode] = useState<WorkMode>('WFO');
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

    const checkInMutation = useCheckIn();
    const checkOutMutation = useCheckOut();

    // FIXED: Check for checkInAt AND absence of checkOutAt
    const isCheckedIn = useMemo(
        () => Boolean(attendanceData?.checkInAt && !attendanceData?.checkOutAt),
        [attendanceData]
    );

    // FIXED: Check for both checkInAt AND checkOutAt
    const isCheckedOut = useMemo(
        () => Boolean(attendanceData?.checkInAt && attendanceData?.checkOutAt),
        [attendanceData]
    );

    const statusConfig = useMemo(() => {
        if (isCheckedOut) {
            return {
                label: 'Shift Completed',
                color: 'bg-blue-500',
                text: 'text-blue-600 dark:text-blue-400',
            };
        }
        if (isCheckedIn) {
            return {
                label: `Working (${elapsedTime})`,
                color: 'bg-emerald-500 animate-pulse',
                text: 'text-emerald-600 dark:text-emerald-400',
            };
        }
        return {
            label: 'Not Checked In',
            color: 'bg-slate-400',
            text: 'text-slate-500 dark:text-slate-400',
        };
    }, [isCheckedIn, isCheckedOut, elapsedTime]);

    useEffect(() => {
        if (!isCheckedIn || !attendanceData?.checkInAt) {
            setElapsedTime('00:00:00');
            return;
        }

        const calculateTime = () => {
            const start = new Date(attendanceData.checkInAt!).getTime();
            const now = new Date().getTime();
            const diffInSeconds = Math.max(0, Math.floor((now - start) / 1000));

            const hours = String(Math.floor(diffInSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(diffInSeconds % 60).padStart(2, '0');

            setElapsedTime(`${hours}:${minutes}:${seconds}`);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [isCheckedIn, attendanceData?.checkInAt]);

    const handlePunchAction = async (): Promise<void> => {
        if (isCheckedOut || isLocating) return;

        setGeoError(null);
        setIsLocating(true);

        try {
            const position = await getCurrentLocation();
            const payload = {
                workMode,
                latitude: position.latitude,
                longitude: position.longitude,
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setGeoError(err.message);
            } else {
                setGeoError('Failed to capture location');
            }
        } finally {
            setIsLocating(false);
        }
    };

    const isLoadingState = isLocating || isAttendanceLoading || checkInMutation.isPending || checkOutMutation.isPending;

    return (
        <div className={`flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm shrink-0 self-start ${className}`}>
            {/* Header Info & Status */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-label-md text-xs font-medium text-on-surface-variant">
                        Daily Attendance
                    </p>
                    <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${statusConfig.text}`}>
                        <span className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
                        {statusConfig.label}
                    </p>
                </div>

                {/* Simple Work Mode Switcher */}
                {!isCheckedIn && !isCheckedOut && (
                    <div className="flex rounded-lg bg-surface-container-high p-0.5 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setWorkMode('WFO')}
                            className={`rounded-md px-2.5 py-1 transition-all ${workMode === 'WFO'
                                    ? 'bg-surface shadow-xs text-on-surface font-semibold'
                                    : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            Office
                        </button>
                        <button
                            type="button"
                            onClick={() => setWorkMode('WFH')}
                            className={`rounded-md px-2.5 py-1 transition-all ${workMode === 'WFH'
                                    ? 'bg-surface shadow-xs text-on-surface font-semibold'
                                    : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            Remote
                        </button>
                    </div>
                )}
            </div>

            {/* Primary Action Button */}
            <button
                type="button"
                disabled={isCheckedOut || isLoadingState}
                onClick={handlePunchAction}
                className={`w-full flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-label-md text-xs font-bold transition-all shadow-sm ${isCheckedOut
                        ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-80'
                        : isCheckedIn
                            ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white'
                            : 'bg-primary hover:bg-primary/90 active:scale-95 text-white'
                    } ${isLoadingState ? 'cursor-wait opacity-70' : ''}`}
            >
                <span className={`material-symbols-outlined text-lg ${isLoadingState ? 'animate-spin' : ''}`}>
                    {isLocating
                        ? 'sync'
                        : isAttendanceLoading
                            ? 'hourglass_empty'
                            : isCheckedOut
                                ? 'verified'
                                : isCheckedIn
                                    ? 'logout'
                                    : 'fingerprint'}
                </span>
                <span>
                    {isLocating
                        ? 'Getting GPS...'
                        : isAttendanceLoading
                            ? 'Loading...'
                            : isCheckedOut
                                ? 'Day Completed'
                                : isCheckedIn
                                    ? 'Check Out Now'
                                    : `Check In (${workMode === 'WFO' ? 'WFO' : 'WFH'})`}
                </span>
            </button>

            {/* Geolocation Error Feedback */}
            {geoError && (
                <p className="text-[11px] font-medium text-rose-500">
                    ⚠️ {geoError}
                </p>
            )}
        </div>
    );
}