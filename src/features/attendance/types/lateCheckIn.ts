// The API stores and returns these lowercase; keep the type honest so
// comparisons against it don't silently fall through.
export type LateCheckInStatus = "pending" | "approved" | "rejected";

export interface LateCheckInUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface LateCheckInItem {
  _id: string;
  employee: LateCheckInUser;
  branch: string;
  requestDate: string;
  reason: string;
  status: LateCheckInStatus;
  reviewedBy?: LateCheckInUser;
  reviewedAt?: string;
  reviewRemarks?: string;
  createdAt: string;
}

export interface ReviewLateCheckInPayload {
  requestId: string;
  status: Extract<LateCheckInStatus, "approved" | "rejected">;
  remarks?: string;
}