export type HolidayType = "national" | "regional" | "company" | "optional";

export interface Holiday {
  _id: string;
  branch: string;
  date: string;
  name: string;
  description?: string;
  type: HolidayType;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayInput {
  branchId: string;
  date: string; // ISO String (z.string().datetime({ offset: true }))
  name: string;
  description?: string;
  type: HolidayType;
}

export interface UpdateHolidayInput {
  date?: string;
  name?: string;
  description?: string;
  type?: HolidayType;
  isActive?: boolean;
}