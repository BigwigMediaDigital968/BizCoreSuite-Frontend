import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { Can } from "@/components/Auth/Can";
import { useCreateBranch, useUpdateBranch } from "../hooks/useBranches";
import BranchAttendanceConfigForm from "./BranchAttendanceConfigForm";
import type { Branch, BranchFormInput } from "@/types/branch";

type Tab = "details" | "attendance";

interface BranchFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass an existing branch to edit it; omit to create a new one. */
  branch?: Branch | null;
  /** Jump straight to a tab — e.g. a "Configure Attendance" shortcut from the list. */
  initialTab?: Tab;
}

const EMPTY_FORM: BranchFormInput = {
  name: "",
  code: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  phone: "",
  email: "",
};

const CODE_PATTERN = /^[A-Z0-9-]+$/;

const toFormInput = (branch: Branch): BranchFormInput => ({
  name: branch.name,
  code: branch.code ?? "",
  description: branch.description ?? "",
  address: branch.address ?? "",
  city: branch.city ?? "",
  state: branch.state ?? "",
  country: branch.country ?? "India",
  phone: branch.phone ?? "",
  email: branch.email ?? "",
});

const tabClass = (active: boolean) =>
  `px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all ${
    active
      ? "bg-primary text-on-primary shadow-sm"
      : "text-on-surface-variant hover:bg-surface-container"
  }`;

const BranchFormModal = ({
  open,
  onClose,
  branch,
  initialTab = "details",
}: BranchFormModalProps) => {
  const navigate = useNavigate();
  const isEditMode = Boolean(branch);

  // Tracks a branch created during THIS modal session so the Attendance tab
  // can unlock without closing and reopening — the create endpoint doesn't
  // accept attendanceConfig, so it can only be configured once the branch exists.
  const [createdBranch, setCreatedBranch] = useState<Branch | null>(null);
  const activeBranch = branch ?? createdBranch;

  const [tab, setTab] = useState<Tab>(isEditMode ? initialTab : "details");
  const [detailsExpanded, setDetailsExpanded] = useState(isEditMode);

  const [form, setForm] = useState<BranchFormInput>(() =>
    branch ? toFormInput(branch) : EMPTY_FORM
  );
  const [errors, setErrors] = useState
    <Partial<Record<keyof BranchFormInput, string>>
  >({});

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const isSubmitting = createBranch.isPending || updateBranch.isPending;

  const setField = (key: keyof BranchFormInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof BranchFormInput, string>> = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }
    if (!CODE_PATTERN.test(form.code.trim())) {
      nextErrors.code = "Uppercase letters, numbers and hyphens only";
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildDetailsPayload = () => {
    const { name, description, address, city, state, country, phone, email } =
      form;
    return {
      name: name.trim(),
      description,
      address,
      city,
      state,
      country,
      phone,
      email,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Edit mode, or a create that already happened earlier in this session —
    // both are now plain updates.
    const targetId = branch?._id ?? createdBranch?._id;
    if (targetId) {
      await updateBranch.mutateAsync({
        id: targetId,
        payload: buildDetailsPayload(),
      });
      onClose();
      return;
    }

    const created = await createBranch.mutateAsync({
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    });
    // Deliberately don't close — offer the optional next steps instead.
    setCreatedBranch(created);
  };

  const handleClose = () => {
    setCreatedBranch(null);
    setTab("details");
    onClose();
  };

  const goAssignAdmin = () => {
    if (!activeBranch) return;
    handleClose();
    navigate(`/employees?branchId=${activeBranch._id}`);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit Branch" : "Create Branch"}
      description={
        isEditMode
          ? `Update details for ${branch?.name}.`
          : "Add a new regional office. Only name and code are required. Everything else can be filled in later."
      }
      size="lg"
    >
      {/* Post-create success panel — offers optional next steps rather than
          forcing the head to fill everything before the branch exists. */}
      {!isEditMode && createdBranch && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <p className="flex items-center gap-2 font-label-md text-xs font-bold text-emerald-800">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            {createdBranch.name} was created.
          </p>
          <p className="font-body-sm text-xs text-emerald-800/80">
            You can set up attendance rules now, or leave that - and putting
            someone in charge - for later.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Can permission="branch-attendance:view">
              <button
                type="button"
                onClick={() => setTab("attendance")}
                className="rounded-lg bg-emerald-700 px-3.5 py-1.5 font-label-sm text-[11px] font-bold text-white hover:bg-emerald-800 transition-colors"
              >
                Configure attendance
              </button>
            </Can>
            <button
              type="button"
              onClick={goAssignAdmin}
              className="rounded-lg border border-emerald-700/30 bg-white px-3.5 py-1.5 font-label-sm text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Assign a branch admin
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="ml-auto font-label-sm text-[11px] font-bold text-emerald-800/70 hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 mb-5 w-fit">
        <button type="button" onClick={() => setTab("details")} className={tabClass(tab === "details")}>
          Branch Details
        </button>
        <Can permission="branch-attendance:view">
          <button
            type="button"
            onClick={() => activeBranch && setTab("attendance")}
            disabled={!activeBranch}
            title={!activeBranch ? "Save the branch first" : undefined}
            className={`${tabClass(tab === "attendance")} ${
              !activeBranch ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            Attendance & Hours
          </button>
        </Can>
        <button
          type="button"
          disabled
          title="Not available yet - holiday management isn't connected to the backend yet"
          className="px-4 py-2 rounded-lg font-label-md text-xs font-bold text-on-surface-variant/40 cursor-not-allowed"
        >
          Holidays
          <span className="ml-1.5 rounded-full bg-outline-variant/30 px-1.5 py-0.5 text-[9px] uppercase">
            Soon
          </span>
        </button>
      </div>

      {tab === "details" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="branch-name"
              label="Branch Name"
              placeholder="e.g. Mumbai"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              error={errors.name}
              required
            />
            <FormField
              id="branch-code"
              label="Branch Code"
              placeholder="e.g. MUM-01"
              value={form.code}
              onChange={(e) => setField("code", e.target.value.toUpperCase())}
              error={errors.code}
              disabled={isEditMode}
              hint={isEditMode ? "Code cannot be changed after creation" : undefined}
              required
            />
          </div>

          {/* Everything else is opt-in — collapsed by default when creating,
              already expanded when editing an existing branch. */}
          <div className="rounded-xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => setDetailsExpanded((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 font-label-md text-xs font-bold text-on-surface"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">
                  tune
                </span>
                Additional Details (optional)
              </span>
              <span
                className={`material-symbols-outlined text-lg transition-transform ${
                  detailsExpanded ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>

            {detailsExpanded && (
              <div className="space-y-4 border-t border-outline-variant/20 p-4">
                <FormField
                  id="branch-description"
                  label="Description"
                  placeholder="Short description (optional)"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
                <FormField
                  id="branch-address"
                  label="Address"
                  placeholder="Street address (optional)"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    id="branch-city"
                    label="City"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                  <FormField
                    id="branch-state"
                    label="State"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                  />
                  <FormField
                    id="branch-country"
                    label="Country"
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="branch-phone"
                    label="Phone"
                    placeholder="Contact number (optional)"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                  <FormField
                    id="branch-email"
                    label="Email"
                    type="email"
                    placeholder="branch@company.com (optional)"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    error={errors.email}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              {createdBranch ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-base">
                {isSubmitting ? "sync" : isEditMode || createdBranch ? "save" : "add_business"}
              </span>
              <span>
                {isSubmitting
                  ? "Saving…"
                  : isEditMode || createdBranch
                  ? "Save Changes"
                  : "Create Branch"}
              </span>
            </button>
          </div>
        </form>
      ) : (
        activeBranch && (
          <BranchAttendanceConfigForm
            branchId={activeBranch._id}
            branchIsActive={activeBranch.isActive}
          />
        )
      )}
    </Modal>
  );
};

export default BranchFormModal;