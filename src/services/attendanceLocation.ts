import type { AttendanceWorkMode } from "@/types/attendance";

/** Alias of the canonical backend-aligned union — kept for existing imports. */
export type WorkMode = AttendanceWorkMode;

export interface AttendanceLocationConfig {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
}

export interface AttendanceLocationResult {
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceFromOffice: number | null;
    detectedWorkMode: WorkMode;
}

export class AttendanceLocationError extends Error {
    code:
        | "GEOLOCATION_UNSUPPORTED"
        | "PERMISSION_DENIED"
        | "POSITION_UNAVAILABLE"
        | "TIMEOUT"
        | "OFFICE_LOCATION_NOT_CONFIGURED";

    constructor(
        message: string,
        code: AttendanceLocationError["code"]
    ) {
        super(message);
        this.name = "AttendanceLocationError";
        this.code = code;
    }
}

const calculateDistanceInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) *
            Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;

    const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const getCurrentAttendanceLocation = (
    config: AttendanceLocationConfig
): Promise<AttendanceLocationResult> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(
                new AttendanceLocationError(
                    "Geolocation is not supported by your browser.",
                    "GEOLOCATION_UNSUPPORTED"
                )
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {
                    latitude,
                    longitude,
                    accuracy,
                } = position.coords;

                const branchLat = config.latitude;
                const branchLng = config.longitude;
                const radiusMeters =
                    config.radiusMeters ?? 200;

                /*
                 * If office coordinates are not configured,
                 * we cannot determine WFO/WFH automatically.
                 */
                if (
                    branchLat == null ||
                    branchLng == null
                ) {
                    reject(
                        new AttendanceLocationError(
                            "Office location is not configured.",
                            "OFFICE_LOCATION_NOT_CONFIGURED"
                        )
                    );
                    return;
                }

                const distanceFromOffice =
                    calculateDistanceInMeters(
                        latitude,
                        longitude,
                        branchLat,
                        branchLng
                    );

                const detectedWorkMode: WorkMode =
                    distanceFromOffice <= radiusMeters
                        ? "WFO"
                        : "WFH";

                resolve({
                    latitude,
                    longitude,
                    accuracy,
                    distanceFromOffice,
                    detectedWorkMode,
                });
            },

            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(
                            new AttendanceLocationError(
                                "Location permission was denied.",
                                "PERMISSION_DENIED"
                            )
                        );
                        break;

                    case error.POSITION_UNAVAILABLE:
                        reject(
                            new AttendanceLocationError(
                                "Your current location could not be determined.",
                                "POSITION_UNAVAILABLE"
                            )
                        );
                        break;

                    case error.TIMEOUT:
                        reject(
                            new AttendanceLocationError(
                                "Location request timed out.",
                                "TIMEOUT"
                            )
                        );
                        break;

                    default:
                        reject(
                            new AttendanceLocationError(
                                "Unable to get your location.",
                                "POSITION_UNAVAILABLE"
                            )
                        );
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};

export const getAttendanceErrorMessage = (
    error: any
): string => {
    const data = error?.response?.data;

    switch (data?.code) {
        case "OUTSIDE_ATTENDANCE_RADIUS":
            return (
                "You are outside the office attendance area."
            );

        default:
            break;
    }

    switch (error?.response?.status) {
        case 401:
            return "Your session has expired. Please log in again.";

        case 403:
            return (
                data?.message ||
                "You are not allowed to perform this action."
            );

        case 409:
            return (
                data?.message ||
                "Your attendance has already been processed."
            );

        case 422:
            return (
                data?.message ||
                "Invalid attendance information."
            );

        case 500:
            return "Server error. Please try again later.";

        default:
            return (
                data?.message ||
                error?.message ||
                "Something went wrong. Please try again."
            );
    }
};