import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { ROLE_LABELS, type Role } from "@/types/auth";
import { useUpdateEmployee } from "../hooks/useEmployees";
import type { Employee } from "@/types/employee";

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  /** Roles the current user is permitted to assign, per the backend's role hierarchy. */
  assignableRoles: Role[];
}

const EmployeeFormModal = ({
  open,
  onClose,
  employee,
  assignableRoles,
}: EmployeeFormModalProps) => {
  // Lazy-initialized from props — the parent remounts this component (via a
  // `key` tied to the target employee) whenever a different row is edited.
  const [form, setForm] = useState(() => ({
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    role: (employee?.role ?? "") as Role | "",
  }));
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const updateEmployee = useUpdateEmployee();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const nextErrors: { name?: string; email?: string } = {};
    if (form.name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await updateEmployee.mutateAsync({
      id: employee._id,
      payload: {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role || undefined,
      },
    });
    onClose();
  };

  // The role this employee already has may not be one the current actor could
  // assign from scratch — still show it so the dropdown reflects reality.
  const roleOptions = Array.from(
    new Set([employee?.role, ...assignableRoles].filter(Boolean))
  ) as Role[];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Employee"
      description={employee ? `Update account details for ${employee.name}.` : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="employee-name"
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          error={errors.name}
          required
        />
        <FormField
          id="employee-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          error={errors.email}
          required
        />

        <div className="space-y-1.5">
          <label
            htmlFor="employee-role"
            className="block font-label-md text-xs font-medium text-on-surface-variant"
          >
            System Role
          </label>
          <div className="relative">
            <select
              id="employee-role"
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: e.target.value as Role }))
              }
              disabled={roleOptions.length <= 1}
              className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateEmployee.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-base">
              {updateEmployee.isPending ? "sync" : "save"}
            </span>
            <span>{updateEmployee.isPending ? "Saving…" : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
