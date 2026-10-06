export interface StringeeNumberUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface StringeeNumberBranch {
  _id: string;
  name: string;
}

export interface StringeeNumber {
  stringeePassword: string;
  stringeeUserId: string;
  _id: string;
  phoneNumber: string;
  label?: string;
  branch?: StringeeNumberBranch;
  assignedTo?: StringeeNumberUser;
  assignedBy?: StringeeNumberUser;
  assignedAt?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStringeeNumberInput {
  phoneNumber: string;
  label?: string;
  branchId?: string;
}

export interface AssignStringeeNumberInput {
  targetUserId: string | null;
  stringeeUserId?: string;
  stringeePassword?: string;
}

export interface UpdateStringeeNumberInput {
  phoneNumber?: string;
  label?: string;
  branchId?: string | null;
}