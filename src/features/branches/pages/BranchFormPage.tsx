import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { isAxiosError } from "axios";
import { Can } from "@/components/Auth/Can";
import { useBranch, useCreateBranch, useUpdateBranch } from "../hooks/useBranches";
import BranchAttendanceConfigForm from "../components/BranchAttendanceConfigForm";
import type { Branch, BranchFormInput, BranchAttendanceConfig } from "@/types/branch";
import BranchHolidaysTab from "../components/BranchHolidaysTab.tsx";

type Tab = "details" | "attendance" | "holidays";

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const DEFAULT_ATTENDANCE_CONFIG: BranchAttendanceConfig = {
  enabled: true,
  timezone: "Asia/Kolkata",
  location: {
    radiusMeters: 200,
  },
  workingDays: [1, 2, 3, 4, 5],
  workingHours: {
    startTime: "09:00",
    endTime: "18:00",
  },
  gracePeriodMinutes: 15,
};

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
  attendanceConfig: DEFAULT_ATTENDANCE_CONFIG,
};

const CODE_PATTERN = /^[A-Z0-9-]+$/;

type AttendanceErrors = Partial<
  Record<
    | "latitude"
    | "longitude"
    | "radiusMeters"
    | "timezone"
    | "workingDays"
    | "workingHours"
    | "gracePeriodMinutes",
    string
  >
>;

/** Empty means "not set" — `Number("")` is 0, which is a valid coordinate. */
const parseCoordinate = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * latitude/longitude are the only attendanceConfig fields the backend has no
 * default for, so a branch cannot be created without them — validate here
 * rather than letting Mongoose reject the whole create with a 500.
 */
const validateAttendance = (config: BranchAttendanceConfig): AttendanceErrors => {
  const errors: AttendanceErrors = {};
  const { latitude, longitude, radiusMeters } = config.location;

  if (latitude === undefined) {
    errors.latitude = "Latitude is required";
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = "Must be between -90 and 90";
  }

  if (longitude === undefined) {
    errors.longitude = "Longitude is required";
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = "Must be between -180 and 180";
  }

  if (!Number.isFinite(radiusMeters) || radiusMeters < 10 || radiusMeters > 5000) {
    errors.radiusMeters = "Must be between 10 and 5000";
  }

  if (!config.timezone.trim()) {
    errors.timezone = "Timezone is required";
  }

  if (config.workingDays.length === 0) {
    errors.workingDays = "Select at least one working day";
  }

  if (!config.workingHours.startTime || !config.workingHours.endTime) {
    errors.workingHours = "Start and end time are required";
  }

  if (
    !Number.isFinite(config.gracePeriodMinutes) ||
    config.gracePeriodMinutes < 0 ||
    config.gracePeriodMinutes > 180
  ) {
    errors.gracePeriodMinutes = "Must be between 0 and 180";
  }

  return errors;
};

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
  attendanceConfig: DEFAULT_ATTENDANCE_CONFIG,
});

const tabClass = (active: boolean, disabled?: boolean) =>
  `py-2 px-4 border-b-2 ${
    disabled
      ? "text-on-surface-variant/40 cursor-not-allowed"
      : active
      ? "border-primary text-primary"
      : "border-transparent text-on-surface-variant"
  }`;

const BranchFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = Boolean(id);

  const { data: existingBranch, isLoading: branchLoading } = useBranch(id);

  const justCreated = searchParams.get("created") === "1";
  const initialTabParam = searchParams.get("tab");

  // Edit Mode state
  const [tab, setTab] = useState<Tab>(
    initialTabParam === "attendance" ? "attendance" : "details"
  );

  // Creation Wizard Step state (1: Details, 2: Attendance)
  const [step, setStep] = useState<1 | 2>(1);

  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [form, setForm] = useState<BranchFormInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof BranchFormInput, string>>>({});
  const [attendanceErrors, setAttendanceErrors] = useState<AttendanceErrors>({});

  useEffect(() => {
    if (isEditMode && existingBranch) {
      setForm(toFormInput(existingBranch));
    }
  }, [isEditMode, existingBranch]);

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const isSubmitting = createBranch.isPending || updateBranch.isPending;

  const setField = (key: keyof BranchFormInput, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAttendanceConfig = <K extends keyof BranchAttendanceConfig>(
    field: K,
    value: BranchAttendanceConfig[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      attendanceConfig: {
        ...(prev.attendanceConfig ?? DEFAULT_ATTENDANCE_CONFIG),
        [field]: value,
      },
    }));
  };

  const toggleDay = (day: number) => {
    const currentDays = form.attendanceConfig?.workingDays ?? DEFAULT_ATTENDANCE_CONFIG.workingDays;
    const workingDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    updateAttendanceConfig("workingDays", workingDays);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const currentLocation = form.attendanceConfig?.location ?? DEFAULT_ATTENDANCE_CONFIG.location;
      updateAttendanceConfig("location", {
        ...currentLocation,
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      });
    });
  };

  const validateDetails = (): boolean => {
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
    const { name, description, address, city, state, country, phone, email } = form;
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

  // Edit mode submit handler
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateDetails() || !id) return;

    try {
      await updateBranch.mutateAsync({ id, payload: buildDetailsPayload() });
      navigate(`/branches/${id}`);
    } catch {
      // Already surfaced by the mutation's error toast.
    }
  };

  // Creation mode submit handler. `useDefaults` falls back to the default
  // hours/days/grace but still sends the entered geofence — the backend
  // requires coordinates either way.
  const handleCreateSubmit = async (useDefaults = false) => {
    if (!validateDetails()) {
      setStep(1);
      return;
    }

    const config: BranchAttendanceConfig = useDefaults
      ? {
          ...DEFAULT_ATTENDANCE_CONFIG,
          location: form.attendanceConfig?.location ?? DEFAULT_ATTENDANCE_CONFIG.location,
        }
      : form.attendanceConfig ?? DEFAULT_ATTENDANCE_CONFIG;

    const configErrors = validateAttendance(config);
    if (Object.keys(configErrors).length > 0) {
      setAttendanceErrors(configErrors);
      setStep(2);
      return;
    }
    setAttendanceErrors({});

    try {
      const created = await createBranch.mutateAsync({
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        attendanceConfig: config,
      });
      navigate(`/branches/${created._id}?created=1`, { replace: true });
    } catch (error) {
      // The mutation already toasts; surface a duplicate code on the field
      // that caused it so the user isn't left on step 2 hunting for it.
      if (isAxiosError(error) && error.response?.data?.code === "BRANCH_CODE_EXISTS") {
        setErrors((prev) => ({ ...prev, code: "This branch code is already taken" }));
        setStep(1);
      }
    }
  };

  const handleNextStep = () => {
    if (validateDetails()) {
      setStep(2);
    }
  };

  const dismissCreatedBanner = () => {
    searchParams.delete("created");
    setSearchParams(searchParams, { replace: true });
  };

  const goAssignAdmin = () => {
    if (!id) return;
    navigate(`/employees?branchId=${id}`);
  };

  const isLoadingRecord = isEditMode && branchLoading && !existingBranch;

  if (isLoadingRecord) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (isEditMode && !branchLoading && !existingBranch) {
    return (
      <div className="min-h-screen bg-surface p-6 flex flex-col items-center justify-center gap-3 text-center">
        <span className="material-symbols-outlined text-3xl text-error">
          domain_disabled
        </span>
        <p className="font-body-md text-on-surface-variant max-w-sm">
          This branch could not be found.
        </p>
        <button
          type="button"
          onClick={() => navigate("/branches")}
          className="mt-2 rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
        >
          Back to Branches
        </button>
      </div>
    );
  }

  const attendance = form.attendanceConfig ?? DEFAULT_ATTENDANCE_CONFIG;

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate(isEditMode ? `/branches/${id}` : "/branches")}
            className="flex items-center gap-1.5 font-label-md text-xs font-bold text-primary hover:underline mb-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            {isEditMode ? "Edit Branch" : "Create Branch"}
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl">
            {isEditMode
              ? `Update details, hours, and settings for ${existingBranch?.name ?? "this branch"}.`
              : "Set up a new branch location and optional attendance settings."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-5">
        {/* Banner */}
        {isEditMode && justCreated && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
            <p className="flex items-center gap-2 font-label-md text-xs font-bold text-emerald-800">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {existingBranch?.name ?? "Branch"} was created successfully.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={goAssignAdmin}
                className="rounded-lg border border-emerald-700/30 bg-white px-3.5 py-1.5 font-label-sm text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                Assign a branch admin
              </button>
              <button
                type="button"
                onClick={dismissCreatedBanner}
                className="ml-auto font-label-sm text-[11px] font-bold text-emerald-800/70 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATION: TABS FOR EDIT MODE, STEP PROGRESS FOR CREATE MODE */}
        {isEditMode ? (
          <div className="flex border-b border-outline-variant/20 mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab("details")}
              className={tabClass(tab === "details")}
            >
              Branch Details
            </button>
            <Can permission="branch-attendance:view">
              <button
                type="button"
                onClick={() => setTab("attendance")}
                className={tabClass(tab === "attendance")}
              >
                Attendance & Hours
              </button>
              <button
              type="button"
              onClick={() => setTab("holidays")}
              className={tabClass(tab === "holidays")}
            >
              Holidays
            </button>
            </Can>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-2 w-fit">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                step === 1 ? "bg-primary text-on-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container/30 text-[10px]">
                1
              </span>
              Branch Details
            </div>
            <span className="text-on-surface-variant/30 text-xs">/</span>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                step === 2 ? "bg-primary text-on-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container/30 text-[10px]">
                2
              </span>
              Attendance & Hours
            </div>
          </div>
        )}

        {/* EDIT MODE: BRANCH DETAILS TAB */}
        {isEditMode && tab === "details" && (
          <form onSubmit={handleEditSubmit}>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="branch-name" className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Branch Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="branch-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                    className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all ${
                      errors.name ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.name && <p className="font-body-sm text-[11px] text-error">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="branch-code" className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Branch Code <span className="text-error">*</span>
                  </label>
                  <input
                    id="branch-code"
                    type="text"
                    value={form.code}
                    disabled
                    className="w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none opacity-60"
                  />
                  <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                    Code cannot be changed after creation
                  </p>
                </div>
              </div>

              {/* Additional Optional Information */}
              <div className="rounded-xl border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setDetailsExpanded((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 font-label-md text-xs font-bold text-on-surface"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">tune</span>
                    Additional Location Details
                  </span>
                  <span className={`material-symbols-outlined text-lg transition-transform ${detailsExpanded ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {detailsExpanded && (
                  <div className="space-y-4 border-t border-outline-variant/20 p-4">
                    <div className="space-y-1.5">
                      <label className="block font-label-md text-xs font-medium text-on-surface-variant">Description</label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-label-md text-xs font-medium text-on-surface-variant">Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setField("address", e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">City</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setField("city", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">State</label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => setField("state", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">Country</label>
                        <input
                          type="text"
                          value={form.country}
                          onChange={(e) => setField("country", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">Phone</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all ${
                            errors.email ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                          }`}
                        />
                        {errors.email && <p className="font-body-sm text-[11px] text-error">{errors.email}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-outline-variant/20 mt-6">
              <button
                type="button"
                onClick={() => navigate(`/branches/${id}`)}
                className="rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}

        {/* EDIT MODE: ATTENDANCE TAB */}
        {isEditMode && tab === "attendance" && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
            <BranchAttendanceConfigForm
              branchId={id!}
              branchIsActive={existingBranch?.isActive ?? true}
            />
          </div>
        )}

         {isEditMode && tab === "holidays" && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
            <BranchHolidaysTab branchId={id!} />
          </div>
        )}

        {/* CREATION MODE: STEP 1 (BRANCH DETAILS) */}
        {!isEditMode && step === 1 && (
          <div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="branch-name" className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Branch Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="branch-name"
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                    className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all ${
                      errors.name ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.name && <p className="font-body-sm text-[11px] text-error">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="branch-code" className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Branch Code <span className="text-error">*</span>
                  </label>
                  <input
                    id="branch-code"
                    type="text"
                    placeholder="e.g. MUM-01"
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value.toUpperCase())}
                    required
                    className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all ${
                      errors.code ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.code && <p className="font-body-sm text-[11px] text-error">{errors.code}</p>}
                </div>
              </div>

              {/* Additional Optional Information */}
              <div className="rounded-xl border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setDetailsExpanded((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 font-label-md text-xs font-bold text-on-surface"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">tune</span>
                    Additional Location Details
                  </span>
                  <span className={`material-symbols-outlined text-lg transition-transform ${detailsExpanded ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {detailsExpanded && (
                  <div className="space-y-4 border-t border-outline-variant/20 p-4">
                    <div className="space-y-1.5">
                      <label className="block font-label-md text-xs font-medium text-on-surface-variant">Description</label>
                      <input
                        type="text"
                        placeholder="Short description (optional)"
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-label-md text-xs font-medium text-on-surface-variant">Address</label>
                      <input
                        type="text"
                        placeholder="Street address (optional)"
                        value={form.address}
                        onChange={(e) => setField("address", e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">City</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setField("city", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">State</label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => setField("state", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">Country</label>
                        <input
                          type="text"
                          value={form.country}
                          onChange={(e) => setField("country", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">Phone</label>
                        <input
                          type="text"
                          placeholder="Contact number (optional)"
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-xs font-medium text-on-surface-variant">Email</label>
                        <input
                          type="email"
                          placeholder="branch@company.com (optional)"
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all ${
                            errors.email ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                          }`}
                        />
                        {errors.email && <p className="font-body-sm text-[11px] text-error">{errors.email}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20 mt-6">
              <button
                type="button"
                onClick={() => navigate("/branches")}
                className="rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-md hover:bg-primary/90 transition-all"
              >
                <span>Continue to Attendance</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* CREATION MODE: STEP 2 (ALL ATTENDANCE & HOURS FIELDS REUSED FROM CONFIG COMPONENT) */}
        {!isEditMode && step === 2 && (
          <div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-5">
              {/* Enabled toggle */}
              <div
                onClick={() => updateAttendanceConfig("enabled", !attendance.enabled)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  attendance.enabled
                    ? "border-outline-variant/30 bg-surface-container-low"
                    : "border-outline-variant/30 bg-surface-container-low opacity-70"
                }`}
              >
                <div>
                  <p className="font-label-md text-xs font-bold text-on-surface">
                    Attendance Tracking: {attendance.enabled ? "Enabled" : "Disabled"}
                  </p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                    Turn off if this branch doesn't track geofenced check-ins yet.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={attendance.enabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateAttendanceConfig("enabled", !attendance.enabled);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    attendance.enabled ? "bg-emerald-600" : "bg-outline-variant/60"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      attendance.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                  Timezone <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={attendance.timezone}
                  placeholder="Asia/Kolkata"
                  onChange={(e) => updateAttendanceConfig("timezone", e.target.value)}
                  className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 ${
                    attendanceErrors.timezone
                      ? "border-error focus:border-error focus:ring-error/20"
                      : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {attendanceErrors.timezone && (
                  <p className="font-body-sm text-[11px] text-error">
                    {attendanceErrors.timezone}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Geofence Location <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="flex items-center gap-1 font-label-sm text-[11px] font-bold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">
                      my_location
                    </span>
                    Use my current location
                  </button>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                  Coordinates are required to create a branch, even when attendance
                  tracking is turned off.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="block font-body-sm text-[11px] text-on-surface-variant/70">
                      Latitude <span className="text-error">*</span>
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 19.076090"
                      value={attendance.location.latitude ?? ""}
                      onChange={(e) =>
                        updateAttendanceConfig("location", {
                          ...attendance.location,
                          latitude: parseCoordinate(e.target.value),
                        })
                      }
                      className={`w-full rounded-xl border bg-surface-container-low px-3 py-2 font-body-sm text-xs text-on-surface outline-none ${
                        attendanceErrors.latitude
                          ? "border-error focus:border-error"
                          : "border-outline-variant/40 focus:border-primary"
                      }`}
                    />
                    {attendanceErrors.latitude && (
                      <p className="font-body-sm text-[11px] text-error">
                        {attendanceErrors.latitude}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="block font-body-sm text-[11px] text-on-surface-variant/70">
                      Longitude <span className="text-error">*</span>
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 72.877426"
                      value={attendance.location.longitude ?? ""}
                      onChange={(e) =>
                        updateAttendanceConfig("location", {
                          ...attendance.location,
                          longitude: parseCoordinate(e.target.value),
                        })
                      }
                      className={`w-full rounded-xl border bg-surface-container-low px-3 py-2 font-body-sm text-xs text-on-surface outline-none ${
                        attendanceErrors.longitude
                          ? "border-error focus:border-error"
                          : "border-outline-variant/40 focus:border-primary"
                      }`}
                    />
                    {attendanceErrors.longitude && (
                      <p className="font-body-sm text-[11px] text-error">
                        {attendanceErrors.longitude}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="block font-body-sm text-[11px] text-on-surface-variant/70">
                      Radius (m) <span className="text-error">*</span>
                    </span>
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      value={attendance.location.radiusMeters}
                      onChange={(e) =>
                        updateAttendanceConfig("location", {
                          ...attendance.location,
                          radiusMeters: Number(e.target.value),
                        })
                      }
                      className={`w-full rounded-xl border bg-surface-container-low px-3 py-2 font-body-sm text-xs text-on-surface outline-none ${
                        attendanceErrors.radiusMeters
                          ? "border-error focus:border-error"
                          : "border-outline-variant/40 focus:border-primary"
                      }`}
                    />
                    {attendanceErrors.radiusMeters && (
                      <p className="font-body-sm text-[11px] text-error">
                        {attendanceErrors.radiusMeters}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Working days */}
              <div className="space-y-2">
                <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                  Working Days <span className="text-error">*</span>
                </label>
                {attendanceErrors.workingDays && (
                  <p className="font-body-sm text-[11px] text-error">
                    {attendanceErrors.workingDays}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const isSelected = attendance.workingDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`rounded-lg px-3.5 py-2 font-label-sm text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working hours + grace period */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Start Time <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    value={attendance.workingHours.startTime}
                    onChange={(e) =>
                      updateAttendanceConfig("workingHours", {
                        ...attendance.workingHours,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                    End Time <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    value={attendance.workingHours.endTime}
                    onChange={(e) =>
                      updateAttendanceConfig("workingHours", {
                        ...attendance.workingHours,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                    Grace Period (min) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={attendance.gracePeriodMinutes}
                    onChange={(e) =>
                      updateAttendanceConfig("gracePeriodMinutes", Number(e.target.value))
                    }
                    className={`w-full rounded-xl border bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:ring-2 ${
                      attendanceErrors.gracePeriodMinutes
                        ? "border-error focus:border-error focus:ring-error/20"
                        : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {attendanceErrors.gracePeriodMinutes && (
                    <p className="font-body-sm text-[11px] text-error">
                      {attendanceErrors.gracePeriodMinutes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 font-label-md text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Details
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateSubmit(true)}
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Use Default Hours
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateSubmit(false)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add_business</span>
                  <span>{isSubmitting ? "Creating..." : "Save & Create Branch"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchFormPage;