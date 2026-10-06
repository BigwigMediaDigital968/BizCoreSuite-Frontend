export interface BranchAttendanceLocation {
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
}

export interface BranchWorkingHours {
  startTime: string; // "HH:MM", 24h
  endTime: string;   // "HH:MM", 24h
}

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()) */
export interface BranchAttendanceConfig {
  enabled: boolean;
  timezone: string;
  location: BranchAttendanceLocation;
  workingDays: number[];
  workingHours: BranchWorkingHours;
  gracePeriodMinutes: number;
}

export interface Branch {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  attendanceConfig?: BranchAttendanceConfig;
  createdAt?: string;
  updatedAt?: string;
  teamSize?: string;
}

export interface BranchFormInput {
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  // Optional attendance configuration for creation
  attendanceConfig?: BranchAttendanceConfig;
}

/** All fields optional; when `location` or `workingHours` are sent, the
 * backend replaces the whole sub-object rather than merging keys — always
 * send the complete sub-object when changing either. */
export type UpdateBranchAttendanceConfigInput = Partial<BranchAttendanceConfig>;

/** Minimal shape returned when a branch is populated onto another document (e.g. an employee). */
export interface BranchRef {
  _id: string;
  name: string;
  code: string;
}