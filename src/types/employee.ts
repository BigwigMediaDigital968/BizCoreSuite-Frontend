import type { Role } from "./auth";
import type { BranchRef } from "./branch";

export interface Employee {
  user: any;
  _id: string;
  name: string;
  email: string;
  role: Role;
  branches: BranchRef[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  branchId?: string;
  isActive?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  branches?: string[];
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  role?: Role;
  branches?: string[];
  isActive?: boolean;
}

/** Slim record returned by create/update/status/branch-assignment mutations. */
export interface EmployeeMutationResult {
  _id: string;
  name: string;
  email: string;
  role: Role;
  branches: string[];
  isActive: boolean;
}

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "intern";

export const EMPLOYMENT_STATUS = {
  ACTIVE: "active",
  PROBATION: "probation",
  NOTICE_PERIOD: "notice_period",
  RESIGNED: "resigned",
  TERMINATED: "terminated",
  INACTIVE: "inactive",
} as const;

export type EmploymentStatus =
  (typeof EMPLOYMENT_STATUS)[keyof typeof EMPLOYMENT_STATUS];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  [EMPLOYMENT_STATUS.ACTIVE]: "Active",
  [EMPLOYMENT_STATUS.PROBATION]: "Probation",
  [EMPLOYMENT_STATUS.NOTICE_PERIOD]: "Notice Period",
  [EMPLOYMENT_STATUS.RESIGNED]: "Resigned",
  [EMPLOYMENT_STATUS.TERMINATED]: "Terminated",
  [EMPLOYMENT_STATUS.INACTIVE]: "Inactive",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

export type Gender = "male" | "female" | "other";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export interface EmployeeDocument {
  _id?: string;
  documentType: string;
  documentNumber?: string;
  documentUrl: string;
  publicId?: string;
  uploadedAt?: string;
}

export interface SalaryStructure {
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowance: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  otherDeduction: number;
  netSalary: number;
}

export const EMPTY_SALARY: SalaryStructure = {
  basic: 0,
  hra: 0,
  conveyance: 0,
  medicalAllowance: 0,
  specialAllowance: 0,
  otherAllowance: 0,
  grossSalary: 0,
  pfDeduction: 0,
  esiDeduction: 0,
  professionalTax: 0,
  otherDeduction: 0,
  netSalary: 0,
};

export interface BankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
}

/** Populated user reference returned by GET /employee/:id. */
export interface EmployeeProfileUserRef {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

/** Populated branch reference returned by GET /employee/:id. */
export interface EmployeeProfileBranchRef {
  _id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
}

/** Populated reporting-manager reference returned by GET /employee/:id. */
export interface EmployeeProfileManagerRef {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface EmployeeProfile {
  _id: string;
  user: EmployeeProfileUserRef;
  employeeCode: string;
  branch: EmployeeProfileBranchRef | string;
  reportingManager?: EmployeeProfileManagerRef | string;
  designation?: string;
  department?: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  joiningDate: string;
  probationEndDate?: string;
  dateOfBirth?: string;
  gender?: Gender;
  personalPhone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  documents: EmployeeDocument[];
  salary: SalaryStructure;
  bankDetails?: BankDetails;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfileListQuery {
  page?: number;
  limit?: number;
  branchId?: string;
  reportingManager?: string;
  status?: EmploymentStatus;
  search?: string;
}

export interface CreateEmployeeProfilePayload {
  userId: string;
  employeeCode: string;
  branchId: string;
  reportingManager?: string;
  designation?: string;
  department?: string;
  employmentType: EmploymentType;
  employmentStatus?: EmploymentStatus;
  joiningDate: string;
  probationEndDate?: string;
  dateOfBirth?: string;
  gender?: Gender;
  personalPhone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  documents?: EmployeeDocument[];
  salary: SalaryStructure;
  bankDetails?: BankDetails;
  notes?: string;
}

export type UpdateEmployeeProfilePayload = Partial<CreateEmployeeProfilePayload>;

/** Helper: pull an ID out of either a populated ref or a raw id string. */
export const refId = (
  ref: EmployeeProfileUserRef | EmployeeProfileBranchRef | EmployeeProfileManagerRef | string | null | undefined
): string => {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
};

/** Helper: pull a display name out of either a populated ref or a raw id string. */
export const refName = (
  ref: EmployeeProfileUserRef | EmployeeProfileBranchRef | EmployeeProfileManagerRef | string | null | undefined,
  fallback = "—"
): string => {
  if (!ref) return fallback;
  if (typeof ref === "string") return ref;
  return ref.name ?? fallback;
};
