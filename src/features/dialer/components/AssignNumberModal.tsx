import React, { useState, useMemo, useEffect, useRef } from "react";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useBranchesQuery } from "@/features/branches";
import type { StringeeNumber } from "@/types/stringeeNumber";

interface AssignNumberModalProps {
  assigningNumber: StringeeNumber | null;
  onClose: () => void;
  isPending: boolean;
  onAssign: (payload: {
    numberId: string;
    targetUserId: string | null;
    stringeeUserId?: string;
    stringeePassword?: string;
  }) => void;
}

export const AssignNumberModal: React.FC<AssignNumberModalProps> = ({
  assigningNumber,
  onClose,
  onAssign,
  isPending = false,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // New input state variables
  const [stringeeUserId, setStringeeUserId] = useState<string>("");
  const [stringeePassword, setStringeePassword] = useState<string>("");

  const [employeeSearch, setEmployeeSearch] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isUpdating = Boolean(assigningNumber?.assignedTo);

  // Fetch Branches
  const { data: branches = [], isLoading: branchesLoading } =
    useBranchesQuery();

  const activeBranches = useMemo(() => {
    return branches.filter((b: any) => b.isActive);
  }, [branches]);

  // Fetch Employees
  const { data: employeesData, isLoading: employeesLoading } =
    useEmployeesQuery({
      role: "employee",
      branchId: selectedBranchId || undefined,
      isActive: true,
      limit: 100,
    });

  const employees = useMemo(() => {
    if (!employeesData) return [];
    if (Array.isArray(employeesData)) return employeesData;
    if (
      "employees" in employeesData &&
      Array.isArray((employeesData as any).employees)
    ) {
      return (employeesData as any).employees;
    }
    if ("data" in employeesData && Array.isArray((employeesData as any).data)) {
      return (employeesData as any).data;
    }
    return [];
  }, [employeesData]);

  // Sync state when component opens/resets
  useEffect(() => {
    if (assigningNumber) {
      const currentBranchId =
        typeof assigningNumber.branch === "object" &&
        assigningNumber.branch !== null
          ? assigningNumber.branch._id
          : assigningNumber.branch || "";

      const currentUserId =
        typeof assigningNumber.assignedTo === "object" &&
        assigningNumber.assignedTo !== null
          ? assigningNumber.assignedTo._id
          : assigningNumber.assignedTo || "";

      setSelectedBranchId(currentBranchId);
      setSelectedUserId(currentUserId);

      // Load pre-existing Stringee credentials if editing
      setStringeeUserId(assigningNumber.stringeeUserId || "");
      setStringeePassword(assigningNumber.stringeePassword || "");
    } else {
      setSelectedBranchId("");
      setSelectedUserId("");
      setStringeeUserId("");
      setStringeePassword("");
    }
    setEmployeeSearch("");
    setIsDropdownOpen(false);
  }, [assigningNumber]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setSelectedUserId("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (emp: any) =>
        emp.name?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query),
    );
  }, [employees, employeeSearch]);

  const selectedEmployee = useMemo(() => {
    return employees.find((emp: any) => emp._id === selectedUserId);
  }, [employees, selectedUserId]);

  if (!assigningNumber) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !stringeeUserId) return;

    onAssign({
      numberId: assigningNumber._id,
      targetUserId: selectedUserId,
      stringeeUserId,
      stringeePassword: stringeePassword || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              {isUpdating
                ? "Reassign / Update Number"
                : "Assign Virtual Number"}
            </h3>
            <p className="font-mono text-xs font-semibold text-primary mt-0.5">
              {assigningNumber.phoneNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch Select */}
          <div className="space-y-1">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Select Branch *
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              disabled={branchesLoading}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
            >
              <option value="">All Branches</option>
              {activeBranches.map((branch: any) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          {/* Employee Searchable Select */}
          <div className="space-y-1 relative" ref={dropdownRef}>
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Select Employee *
            </label>

            <div
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center justify-between w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs cursor-pointer focus:border-primary focus:outline-none"
            >
              <span
                className={
                  selectedEmployee
                    ? "font-bold text-on-surface"
                    : "text-on-surface-variant/60"
                }
              >
                {selectedEmployee
                  ? `${selectedEmployee.name} (${selectedEmployee.email})`
                  : employeesLoading
                    ? "Loading employees..."
                    : selectedBranchId
                      ? "Choose an employee in this branch..."
                      : "Choose an employee..."}
              </span>
              <span className="material-symbols-outlined text-base text-on-surface-variant">
                {isDropdownOpen ? "arrow_drop_up" : "arrow_drop_down"}
              </span>
            </div>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-56 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg flex flex-col">
                <div className="p-2 border-b border-outline-variant/20 bg-surface-container-low/50">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      search
                    </span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search name or email..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-40 divide-y divide-outline-variant/10">
                  {employeesLoading ? (
                    <div className="p-3 text-center text-xs text-on-surface-variant">
                      Loading employees...
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="p-3 text-center text-xs text-on-surface-variant">
                      No employees found{" "}
                      {selectedBranchId ? "in selected branch" : ""}.
                    </div>
                  ) : (
                    filteredEmployees.map((emp: any) => (
                      <div
                        key={emp._id}
                        onClick={() => {
                          setSelectedUserId(emp._id);
                          setIsDropdownOpen(false);
                          setEmployeeSearch("");
                        }}
                        className={`p-2.5 px-3 text-xs cursor-pointer hover:bg-surface-container-low transition-colors flex items-center justify-between ${
                          selectedUserId === emp._id
                            ? "bg-primary/10 font-bold text-primary"
                            : "text-on-surface"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-[10px] text-on-surface-variant/70">
                            {emp.email}
                          </div>
                        </div>
                        {selectedUserId === emp._id && (
                          <span className="material-symbols-outlined text-base text-primary">
                            check
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stringee Credentials Section */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-outline-variant/20">
            <div className="space-y-1">
              <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Stringee User ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. stringee_user_123"
                value={stringeeUserId}
                onChange={(e) => setStringeeUserId(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Stringee Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={stringeePassword}
                onChange={(e) => setStringeePassword(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isPending ||
                !selectedUserId ||
                !stringeeUserId ||
                !stringeePassword
              }
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isPending
                ? isUpdating
                  ? "Updating..."
                  : "Assigning..."
                : isUpdating
                  ? "Update Assignment"
                  : "Confirm Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignNumberModal;
