import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useBranchesQuery } from "@/features/branches";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_LABELS, ROLES, getAssignableRoles, type Role } from "@/types/auth";
import {
    EMPLOYMENT_STATUS,
    EMPLOYMENT_STATUS_LABELS,
    EMPLOYMENT_TYPE_LABELS,
    EMPTY_SALARY,
    GENDER_LABELS,
    refId,
    type BankDetails,
    type EmployeeProfile,
    type EmploymentStatus,
    type EmploymentType,
    type Gender,
    type SalaryStructure,
} from "@/types/employee";
import DocumentsSection from "../components/DocumentsSection";
import ResetPasswordButton from "../components/ResetPasswordButton";
import SalarySection from "../components/SalarySection";
import {
    useCreateEmployee,
    useCreateEmployeeProfile,
    useEmployeeProfileByUserQuery,
    useEmployeeQuery,
    useReportingManagersQuery,
    useUpdateEmployee,
    useUpdateEmployeeBranches,
    useUpdateEmployeeProfile,
    useUpdateEmployeeStatus,
} from "../hooks/useEmployees";
import toast from "react-hot-toast";

// ----------------------------------------------------------------------------
// Local form types
// ----------------------------------------------------------------------------

interface UserFormState {
    fullName: string;
    officialEmail: string;
    password: string;
    role: Role | "";
    branches: string[];
    isActive: boolean;
}

interface ProfileFormState {
    employeeCode: string;
    branchId: string;
    reportingManager: string;
    designation: string;
    department: string;
    employmentType: EmploymentType;
    employmentStatus: EmploymentStatus;
    joiningDate: string;
    probationEndDate: string;
    dateOfBirth: string;
    gender: Gender | "";
    personalPhone: string;
    alternatePhone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    salary: SalaryStructure;
    bank: BankDetails;
    notes: string;
    documents: EmployeeProfile["documents"];
}

const EMPTY_PROFILE: ProfileFormState = {
    employeeCode: "",
    branchId: "",
    reportingManager: "",
    designation: "",
    department: "",
    employmentType: "full_time",
    employmentStatus: EMPLOYMENT_STATUS.PROBATION,
    joiningDate: new Date().toISOString().slice(0, 10),
    probationEndDate: "",
    dateOfBirth: "",
    gender: "",
    personalPhone: "",
    alternatePhone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    salary: EMPTY_SALARY,
    bank: {},
    notes: "",
    documents: [],
};

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

const EmployeeFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const currentUser = useAuthStore((s) => s.user);
    const isSelfEdit = isEditMode && currentUser?._id === id;

    const { data: existingEmployee, isLoading: employeeLoading } =
        useEmployeeQuery(id);

    const { data: branches, isLoading: branchesLoading } = useBranchesQuery();

    const isHeadActor = currentUser?.role === ROLES.HEAD;

    // Branches the current actor can hand out to an account they're creating.
    // Head can assign any branch; everyone else (Admin/Manager) can only
    // assign within their own — they're never shown branches outside their
    // own scope to pick from.
    const assignableBranches = useMemo(() => {
        if (!branches) return [];
        if (isHeadActor) return branches;
        const own = new Set(currentUser?.branches ?? []);
        return branches.filter((b) => own.has(b._id));
    }, [branches, isHeadActor, currentUser?.branches]);

    // Profile is loaded in edit mode via the byUser lookup.
    const { data: existingProfile, isLoading: profileLoading } =
        useEmployeeProfileByUserQuery(id);

    const createEmployee = useCreateEmployee();
    const updateEmployee = useUpdateEmployee();
    const updateBranches = useUpdateEmployeeBranches();
    const updateUserStatus = useUpdateEmployeeStatus();
    const createProfile = useCreateEmployeeProfile();
    const updateProfile = useUpdateEmployeeProfile();

    const [activeTab, setActiveTab] = useState<"account" | "profile">("account");


    // -----------------------------------------------------------------------
    // User (account) form
    // -----------------------------------------------------------------------

    const assignableRoles = useMemo(() => {
        if (!currentUser) return [];
        const roles = getAssignableRoles(currentUser.role);
        if (
            isEditMode &&
            existingEmployee &&
            !roles.includes(existingEmployee.role)
        ) {
            return [...roles, existingEmployee.role];
        }
        return roles;
    }, [currentUser, isEditMode, existingEmployee]);

    const [userForm, setUserForm] = useState<UserFormState>({
        fullName: "",
        officialEmail: "",
        password: "",
        role: "" as Role | "",
        branches: [],
        isActive: true,
    });
    const [userErrors, setUserErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isEditMode || !existingEmployee) return;
        setUserForm({
            fullName: existingEmployee.name,
            officialEmail: existingEmployee.email,
            password: "",
            role: existingEmployee.role,
            branches: existingEmployee.branches.map((b: any) => b._id), //it need to be changed when updated
            isActive: existingEmployee.isActive,
        });
    }, [isEditMode, existingEmployee]);

    const handleBranchToggle = (branchId: string) => {
        setUserForm((prev) => {
            const isSingle = ["employee", "manager"].includes(prev.role);
            if (isSingle) return { ...prev, branches: [branchId] };
            const has = prev.branches.includes(branchId);
            return {
                ...prev,
                branches: has
                    ? prev.branches.filter((b) => b !== branchId)
                    : [...prev.branches, branchId],
            };
        });
    };

    useEffect(() => {
        // When role becomes a single-branch role, collapse to first selected
        // branch so we don't accidentally send 2+ to the backend.
        setUserForm((prev) => {
            if (["employee", "manager"].includes(prev.role)) {
                return { ...prev, branches: prev.branches.slice(0, 1) };
            }
            return prev;
        });
    }, [userForm.role]);

    // Onboarding only: when a non-Head actor (or Head, if the org only has
    // one branch) has exactly one assignable branch, there's nothing to
    // pick — auto-assign it so Manager/Employee accounts don't need a
    // pointless one-option picker. Head with multiple branches still
    // chooses manually below.
    useEffect(() => {
        if (isEditMode) return;
        const isSingleBranchRole =
            userForm.role === ROLES.MANAGER || userForm.role === ROLES.EMPLOYEE;
        if (!isSingleBranchRole || assignableBranches.length !== 1) return;
        setUserForm((prev) =>
            prev.branches[0] === assignableBranches[0]._id
                ? prev
                : { ...prev, branches: [assignableBranches[0]._id] }
        );
    }, [isEditMode, userForm.role, assignableBranches]);

    const validateUser = () => {
        const nextErrors: Record<string, string> = {};
        if (userForm.fullName.trim().length < 2)
            nextErrors.fullName = "Name must be at least 2 characters";
        if (!/^\S+@\S+\.\S+$/.test(userForm.officialEmail))
            nextErrors.officialEmail = "Enter a valid email address";
        if (!isEditMode && userForm.password.length < 8)
            nextErrors.password = "Password must be at least 8 characters";
        if (!userForm.role) nextErrors.role = "Select a role";
        // Admin branches can be assigned later (e.g. via "Assign a branch
        // admin" from the Branches page) — every other role needs one up
        // front since access is scoped by it.
        if (userForm.role !== ROLES.ADMIN && userForm.branches.length === 0)
            nextErrors.branches = "Assign at least one branch";
        setUserErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const submitUser = async (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!validateUser() || !userForm.role) return;

        try {
            if (isEditMode && id) {
                const originalBranchIds = (
                    existingEmployee?.branches.map((b) => b._id) ?? []
                )
                    .map((b: any) => b._id)
                    .sort();
                const nextBranchIds = [...userForm.branches].sort();
                const branchesChanged =
                    JSON.stringify(originalBranchIds) !==
                    JSON.stringify(nextBranchIds);

                await updateEmployee.mutateAsync({
                    id,
                    payload: {
                        name: userForm.fullName.trim(),
                        email: userForm.officialEmail.trim().toLowerCase(),
                        role: userForm.role,
                    },
                });
                if (branchesChanged) {
                    await updateBranches.mutateAsync(
                        {
                            id,
                            branches: userForm.branches
                        }
                    )
                }
                if (existingEmployee?.isActive !== userForm.isActive) {
                    await updateUserStatus.mutateAsync({
                        id,
                        isActive: userForm.isActive
                    })
                }

            } else {
                await createEmployee.mutateAsync({
                    name: userForm.fullName.trim(),
                    email: userForm.officialEmail.trim().toLowerCase(),
                    password: userForm.password,
                    role: userForm.role,
                    branches: userForm.branches,
                });
                // Onboarding flow: stop here, the user list is the next stop.
                navigate("/employees");
                return;
            }
        } catch {
            /* toast handled in mutation */
        }
    };

    // -----------------------------------------------------------------------
    // Profile form
    // -----------------------------------------------------------------------

    const [profileForm, setProfileForm] =
        useState<ProfileFormState>(EMPTY_PROFILE);
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
        {}
    );
    const [profileMode, setProfileMode] = useState<"create" | "update">(
        "create"
    );

    useEffect(() => {
        if (!isEditMode) return;
        if (existingProfile) {
            setProfileMode("update");
            setProfileForm({
                employeeCode: existingProfile.employeeCode,
                branchId: refId(existingProfile.branch),
                reportingManager: refId(existingProfile.reportingManager),
                designation: existingProfile.designation ?? "",
                department: existingProfile.department ?? "",
                employmentType: existingProfile.employmentType,
                employmentStatus:
                    existingProfile.employmentStatus ??
                    EMPLOYMENT_STATUS.PROBATION,
                joiningDate:
                    existingProfile.joiningDate?.slice(0, 10) ??
                    EMPTY_PROFILE.joiningDate,
                probationEndDate:
                    existingProfile.probationEndDate?.slice(0, 10) ?? "",
                dateOfBirth: existingProfile.dateOfBirth?.slice(0, 10) ?? "",
                gender: (existingProfile.gender ?? "") as Gender | "",
                personalPhone: existingProfile.personalPhone ?? "",
                alternatePhone: existingProfile.alternatePhone ?? "",
                address: existingProfile.address ?? "",
                city: existingProfile.city ?? "",
                state: existingProfile.state ?? "",
                country: existingProfile.country ?? "India",
                postalCode: existingProfile.postalCode ?? "",
                emergencyContactName:
                    existingProfile.emergencyContactName ?? "",
                emergencyContactPhone:
                    existingProfile.emergencyContactPhone ?? "",
                emergencyContactRelation:
                    existingProfile.emergencyContactRelation ?? "",
                salary: existingProfile.salary,
                bank: existingProfile.bankDetails ?? {},
                notes: existingProfile.notes ?? "",
                documents: existingProfile.documents ?? [],
            });
        } else {
            setProfileMode("create");
            setProfileForm({
                ...profileForm,
                branchId: refId(existingEmployee?.branches[0]),
            })
        }
    }, [isEditMode, existingProfile, existingEmployee]);

    const { data: managers, isLoading: managersLoading } =
        useReportingManagersQuery(profileForm.branchId || undefined);

    const validateProfile = (): boolean => {
        const next: Record<string, string> = {};
        if (!profileForm.employeeCode.trim())
            next.employeeCode = "Employee code is required";
        else if (profileForm.employeeCode.trim().length < 2)
            next.employeeCode = "Code must be at least 2 characters";
        if (!profileForm.branchId) next.branchId = "Select a branch";
        if (!profileForm.joiningDate)
            next.joiningDate = "Joining date is required";
        if (profileForm.salary.grossSalary < 0)
            next.salary = "Gross salary can't be negative";
        setProfileErrors(next);
        return Object.keys(next).length === 0;
    };

    const submitProfile = async (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isEditMode || !id) return;
        if (!validateProfile()) return;

        const payload = {
            userId: id,
            employeeCode: profileForm.employeeCode.trim().toUpperCase(),
            branchId: profileForm.branchId,
            reportingManager: profileForm.reportingManager || undefined,
            designation: profileForm.designation.trim() || undefined,
            department: profileForm.department.trim() || undefined,
            employmentType: profileForm.employmentType,
            employmentStatus: profileForm.employmentStatus,
            joiningDate: profileForm.joiningDate,
            probationEndDate: profileForm.probationEndDate || undefined,
            dateOfBirth: profileForm.dateOfBirth || undefined,
            gender: (profileForm.gender || undefined) as Gender | undefined,
            personalPhone: profileForm.personalPhone.trim() || undefined,
            alternatePhone: profileForm.alternatePhone.trim() || undefined,
            address: profileForm.address.trim() || undefined,
            city: profileForm.city.trim() || undefined,
            state: profileForm.state.trim() || undefined,
            country: profileForm.country.trim() || undefined,
            postalCode: profileForm.postalCode.trim() || undefined,
            emergencyContactName:
                profileForm.emergencyContactName.trim() || undefined,
            emergencyContactPhone:
                profileForm.emergencyContactPhone.trim() || undefined,
            emergencyContactRelation:
                profileForm.emergencyContactRelation.trim() || undefined,
            salary: profileForm.salary,
            bankDetails:
                Object.keys(profileForm.bank).length > 0
                    ? profileForm.bank
                    : undefined,
            notes: profileForm.notes.trim() || undefined,
            documents:
                profileForm.documents.length > 0
                    ? profileForm.documents
                    : undefined,
        };

        try {
            if (profileMode === "create") {
                await createProfile.mutateAsync(payload);
            } else {
                if (!existingProfile) return toast.error("Unable to Find Employee Profile");

                await updateProfile.mutateAsync({
                    id: existingProfile?._id,
                    payload,
                });

            }
        } catch {
            /* toast handled in mutation */
        }
    };

    // -----------------------------------------------------------------------
    // Loading / guards
    // -----------------------------------------------------------------------

    const isLoadingRecord = isEditMode && (employeeLoading || profileLoading);

    const isHeadTarget =
        isEditMode && existingEmployee?.role === ROLES.HEAD;
    const isBlocked = isSelfEdit || isHeadTarget;

    const copy = isEditMode
        ? {
            title: "Edit Employee",
            subtitle:
                "Update account access and employee profile details independently — each section saves on its own.",
            icon: "edit",
        }
        : {
            title: "Onboard New Employee",
            subtitle:
                "Create an account, set system access permissions, and assign operational branches.",
            submitIdle: "Create Employee",
            icon: "person_add",
        };

    if (isLoadingRecord) {
        return (
            <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                    progress_activity
                </span>
            </div>
        );
    }

    if (isBlocked) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-3xl text-error">
                    block
                </span>
                <p className="font-body-md text-on-surface-variant max-w-sm">
                    {isSelfEdit
                        ? "You can't edit your own account through this form."
                        : "Head-level accounts can't be modified through this form."}
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className="mt-2 rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                    Back to Employees
                </button>
            </div>
        );
    }


    const userSubmitting =
        createEmployee.isPending ||
        updateEmployee.isPending ||
        updateBranches.isPending || updateUserStatus.isPending;
    const profileSubmitting =
        createProfile.isPending || updateProfile.isPending;

    // Branch picker behavior for the Account & Access form — only applies
    // while onboarding (edit mode keeps its existing full picker, since
    // reassigning an existing account's branches is a deliberate action,
    // not a default).
    const isSingleBranchRoleSelected =
        userForm.role === ROLES.MANAGER || userForm.role === ROLES.EMPLOYEE;
    const isAdminRoleSelected = userForm.role === ROLES.ADMIN;
    // Nothing to pick when the actor can only ever hand out one branch —
    // show it as a fact, not a one-option dropdown.
    const showAutoBranchLabel =
        !isEditMode && isSingleBranchRoleSelected && assignableBranches.length <= 1;
    // Onboarding is restricted to branches the actor themselves can reach;
    // editing an existing account keeps the full org-wide list.
    const branchPickerSource = isEditMode ? branches ?? [] : assignableBranches;

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-5">
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 font-label-md text-xs font-bold text-primary hover:underline mb-2"
                    >
                        <span className="material-symbols-outlined text-sm">
                            arrow_back
                        </span>
                        Back
                    </button>
                    <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                        {copy.title}
                    </h1>
                    <p className="font-body-md text-sm text-on-surface-variant">
                        {copy.subtitle}
                    </p>
                </div>

                {isEditMode && (
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <ResetPasswordButton
                            userId={id}
                            userName={existingEmployee?.name}
                            targetRole={existingEmployee?.role}
                        />

                        <button
                            type="button"
                            onClick={() => navigate(`/employees/${id}/profile`)}
                            className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">
                                visibility
                            </span>
                            View Profile
                        </button>
                    </div>
                )}
            </div>


            <div className="flex border-b border-outline-variant/20 mb-4 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => setActiveTab("account")}
                    className={`py-2 px-4 border-b-2 ${activeTab === "account" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`}
                >
                    Account & Access
                </button>
                {
                    isEditMode && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className={`py-2 px-4 border-b-2 ${activeTab === "profile" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`}
                        >
                            Details & Salary
                        </button>
                    )
                }
            </div>

            <div className="space-y-4">
                {activeTab === "account" && (
                    <>
                        {/* ============================================================
                    Card 1 — Account & Access (User)
                   ============================================================ */}
                        <form
                            id="user-form"
                            onSubmit={submitUser}
                            className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2.5 text-primary">
                                    <span className="material-symbols-outlined text-2xl">
                                        {copy.icon}
                                    </span>
                                    <div>
                                        <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                                            Account & Access
                                        </h2>
                                        <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                            Login identity, role and branch assignment.
                                        </p>
                                    </div>
                                </div>
                                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    <span className="material-symbols-outlined text-sm">
                                        shield_person
                                    </span>
                                    User record
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="fullName"
                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                    >
                                        Full Name
                                    </label>
                                    <div
                                        className={`relative flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 transition-all ${userErrors.fullName
                                            ? "border-error focus-within:border-error focus-within:ring-error/20"
                                            : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                            person
                                        </span>
                                        <input
                                            id="fullName"
                                            type="text"
                                            placeholder="e.g. Rahul Desai"
                                            value={userForm.fullName}
                                            onChange={(e) =>
                                                setUserForm({
                                                    ...userForm,
                                                    fullName: e.target.value,
                                                })
                                            }
                                            className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                            required
                                        />
                                    </div>
                                    {userErrors.fullName && (
                                        <p className="font-body-sm text-[11px] text-error">
                                            {userErrors.fullName}
                                        </p>
                                    )}
                                </div>

                                {/* Official Email */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="officialEmail"
                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                    >
                                        Official Email
                                    </label>
                                    <div
                                        className={`relative flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 transition-all ${userErrors.officialEmail
                                            ? "border-error focus-within:border-error focus-within:ring-error/20"
                                            : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                            mail
                                        </span>
                                        <input
                                            id="officialEmail"
                                            type="email"
                                            placeholder="rahul.desai@company.com"
                                            value={userForm.officialEmail}
                                            onChange={(e) =>
                                                setUserForm({
                                                    ...userForm,
                                                    officialEmail: e.target.value,
                                                })
                                            }
                                            className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                            required
                                        />
                                    </div>
                                    {userErrors.officialEmail && (
                                        <p className="font-body-sm text-[11px] text-error">
                                            {userErrors.officialEmail}
                                        </p>
                                    )}
                                </div>

                                {/* Temporary Password — create mode only */}
                                {!isEditMode && (
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label
                                            htmlFor="password"
                                            className="block font-label-md text-xs font-medium text-on-surface-variant"
                                        >
                                            Temporary Password
                                        </label>
                                        <div
                                            className={`relative flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 transition-all ${userErrors.password
                                                ? "border-error focus-within:border-error focus-within:ring-error/20"
                                                : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                lock
                                            </span>
                                            <input
                                                id="password"
                                                type={
                                                    showPassword ? "text" : "password"
                                                }
                                                placeholder="••••••••"
                                                value={userForm.password}
                                                onChange={(e) =>
                                                    setUserForm({
                                                        ...userForm,
                                                        password: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword((prev) => !prev)
                                                }
                                                className="text-on-surface-variant/60 hover:text-on-surface transition-colors focus:outline-none"
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                <span className="material-symbols-outlined text-xl">
                                                    {showPassword
                                                        ? "visibility_off"
                                                        : "visibility"}
                                                </span>
                                            </button>
                                        </div>
                                        {userErrors.password ? (
                                            <p className="font-body-sm text-[11px] text-error">
                                                {userErrors.password}
                                            </p>
                                        ) : (
                                            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                                Minimum 8 characters. The employee
                                                should change this after first login.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {isEditMode && (
                                    <div className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-surface-container-low px-3.5 py-2.5">
                                        <span className="material-symbols-outlined text-lg text-on-surface-variant/60">
                                            info
                                        </span>
                                        <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                            Password changes aren't handled from this
                                            form. Use the dedicated reset-password
                                            action instead.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <hr className="border-outline-variant/20" />

                            {/* Role + Branches */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="role"
                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                    >
                                        System Role
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="role"
                                            value={userForm.role}
                                            onChange={(e) =>
                                                setUserForm({
                                                    ...userForm,
                                                    role: e.target.value as Role,
                                                })
                                            }
                                            className={`w-full appearance-none rounded-xl border bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all cursor-pointer ${userErrors.role
                                                ? "border-error focus:border-error focus:ring-error/20"
                                                : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                                                }`}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select a role...
                                            </option>
                                            {assignableRoles.map((role) => (
                                                <option key={role} value={role}>
                                                    {ROLE_LABELS[role]}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                                            expand_more
                                        </span>
                                    </div>
                                    {userErrors.role ? (
                                        <p className="font-body-sm text-[11px] text-error">
                                            {userErrors.role}
                                        </p>
                                    ) : (
                                        <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                            Determines access level and permissions
                                            within the CRM.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                                        Assigned Branches
                                        {!isEditMode && isAdminRoleSelected && (
                                            <span className="ml-1.5 font-normal normal-case text-on-surface-variant/60">
                                                (optional — can be assigned later)
                                            </span>
                                        )}
                                    </label>
                                    {branchesLoading ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-11 rounded-xl bg-surface-container-high animate-pulse"
                                                />
                                            ))}
                                        </div>
                                    ) : showAutoBranchLabel ? (
                                        <div className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface-variant">
                                            {assignableBranches[0]?.name ??
                                                "No branch assigned to your own account — contact a Head user."}
                                        </div>
                                    ) : branchPickerSource.length === 0 ? (
                                        <p className="font-body-sm text-xs text-on-surface-variant/70 italic">
                                            {isEditMode
                                                ? "No active branches yet — create one from the Branches page first."
                                                : "You have no branches assigned to your own account to hand out — contact a Head user."}
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {branchPickerSource.map((branch) => {
                                                const isChecked =
                                                    userForm.branches.includes(
                                                        branch._id
                                                    );
                                                return (
                                                    <label
                                                        key={branch._id}
                                                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all cursor-pointer ${isChecked
                                                            ? "border-primary bg-primary/5 text-primary font-medium"
                                                            : "border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() =>
                                                                handleBranchToggle(
                                                                    branch._id
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                                                        />
                                                        <span className="font-body-sm text-xs truncate">
                                                            {branch.name}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {userErrors.branches && (
                                        <p className="font-body-sm text-[11px] text-error">
                                            {userErrors.branches}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {isEditMode && (
                                <>
                                    <hr className="border-outline-variant/20" />
                                    {/* Status toggle */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2.5 text-primary">
                                            <span className="material-symbols-outlined text-2xl">
                                                toggle_on
                                            </span>
                                            <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                                                Account Status
                                            </h2>
                                        </div>

                                        <div
                                            onClick={() =>
                                                setUserForm((prev) => ({
                                                    ...prev,
                                                    isActive: !prev.isActive,
                                                }))
                                            }
                                            className={`group flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-200 ${userForm.isActive
                                                ? "border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60"
                                                : "border-error/30 bg-error/5 hover:border-error/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3.5 select-none">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${userForm.isActive
                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                        : "bg-error/10 text-error"
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-xl">
                                                        {userForm.isActive
                                                            ? "check_circle"
                                                            : "block"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-label-md text-xs font-bold text-on-surface">
                                                        Account Status:{" "}
                                                        {userForm.isActive
                                                            ? "Active"
                                                            : "Deactivated"}
                                                    </p>
                                                    <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                                        {userForm.isActive
                                                            ? "Employee can log in and access assigned CRM resources."
                                                            : "Employee will be immediately signed out and blocked from logging in."}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={userForm.isActive}
                                                aria-label="Toggle user status"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUserForm((prev) => ({
                                                        ...prev,
                                                        isActive: !prev.isActive,
                                                    }));
                                                }}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${userForm.isActive
                                                    ? "bg-emerald-600"
                                                    : "bg-outline-variant/60"
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${userForm.isActive
                                                        ? "translate-x-5"
                                                        : "translate-x-0.5"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Card-level Save */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                                <button
                                    type="button"
                                    onClick={() =>
                                        isEditMode ? navigate(-1) : navigate("/employees")
                                    }
                                    className="rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                >
                                    {isEditMode ? "Cancel" : "Discard"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={userSubmitting}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {userSubmitting ? "sync" : copy.icon}
                                    </span>
                                    <span>
                                        {userSubmitting
                                            ? "Saving..."
                                            : isEditMode
                                                ? "Save Account"
                                                : copy.submitIdle}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {activeTab === "profile" && (
                    <>
                        {isEditMode && id && (
                            <form
                                id="profile-form"
                                onSubmit={submitProfile}
                                className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-2.5 text-primary">
                                        <span className="material-symbols-outlined text-2xl">
                                            badge
                                        </span>
                                        <div>
                                            <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                                                Employee Profile
                                            </h2>
                                            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                                HR record: employment, personal,
                                                payroll, bank & documents.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-primary">
                                        <span className="material-symbols-outlined text-sm">
                                            {profileMode === "create"
                                                ? "add_circle"
                                                : "edit_note"}
                                        </span>
                                        {profileMode === "create"
                                            ? "Not created yet"
                                            : "Existing record"}
                                    </span>
                                </div>

                                {/* Employment section */}
                                <div className="space-y-4">
                                    <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">
                                            work
                                        </span>
                                        Employment
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Employee code */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="employeeCode"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Employee Code
                                            </label>
                                            <div
                                                className={`relative flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 transition-all ${profileErrors.employeeCode
                                                    ? "border-error focus-within:border-error focus-within:ring-error/20"
                                                    : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    tag
                                                </span>
                                                <input
                                                    id="employeeCode"
                                                    type="text"
                                                    placeholder="e.g. EMP-001"
                                                    value={profileForm.employeeCode}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            employeeCode:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40 uppercase"
                                                    required
                                                />
                                            </div>
                                            {profileErrors.employeeCode && (
                                                <p className="font-body-sm text-[11px] text-error">
                                                    {profileErrors.employeeCode}
                                                </p>
                                            )}
                                        </div>

                                        {/* Branch (single — backend requires exactly one for profile) */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="profileBranchId"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Primary Branch
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="profileBranchId"
                                                    value={profileForm.branchId}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            branchId: e.target.value,
                                                            reportingManager: "",
                                                        })
                                                    }
                                                    disabled={branchesLoading || existingEmployee && true}
                                                    className={`w-full appearance-none rounded-xl border bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:ring-2 transition-all cursor-no-drop ${profileErrors.branchId
                                                        ? "border-error focus:border-error focus:ring-error/20"
                                                        : "border-outline-variant/40 focus:border-primary focus:ring-primary/20"
                                                        }`}
                                                >
                                                    <option value="">
                                                        Select a branch...
                                                    </option>
                                                    {branches?.map((b) => (
                                                        <option
                                                            key={b._id}
                                                            value={b._id}
                                                        >
                                                            {b.name} ({b.code})
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                                                    expand_more
                                                </span>
                                            </div>
                                            {profileErrors.branchId && (
                                                <p className="font-body-sm text-[11px] text-error">
                                                    {profileErrors.branchId}
                                                </p>
                                            )}
                                        </div>

                                        {/* Designation */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="designation"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Designation
                                            </label>
                                            <div className="relative flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    workspace_premium
                                                </span>
                                                <input
                                                    id="designation"
                                                    type="text"
                                                    placeholder="e.g. Senior Counselor"
                                                    value={profileForm.designation}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            designation: e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                                />
                                            </div>
                                        </div>

                                        {/* Department */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="department"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Department
                                            </label>
                                            <div className="relative flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    apartment
                                                </span>
                                                <input
                                                    id="department"
                                                    type="text"
                                                    placeholder="e.g. Sales"
                                                    value={profileForm.department}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            department: e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                                />
                                            </div>
                                        </div>

                                        {/* Employment type */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="employmentType"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Employment Type
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="employmentType"
                                                    value={profileForm.employmentType}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            employmentType: e.target
                                                                .value as EmploymentType,
                                                        })
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                                >
                                                    {(
                                                        Object.entries(
                                                            EMPLOYMENT_TYPE_LABELS
                                                        ) as [EmploymentType, string][]
                                                    ).map(([k, v]) => (
                                                        <option key={k} value={k}>
                                                            {v}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>

                                        {/* Employment status */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="employmentStatus"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Employment Status
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="employmentStatus"
                                                    value={profileForm.employmentStatus}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            employmentStatus: e.target
                                                                .value as EmploymentStatus,
                                                        })
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                                >
                                                    {(
                                                        Object.entries(
                                                            EMPLOYMENT_STATUS_LABELS
                                                        ) as [EmploymentStatus, string][]
                                                    ).map(([k, v]) => (
                                                        <option key={k} value={k}>
                                                            {v}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>

                                        {/* Joining date */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="joiningDate"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Joining Date
                                            </label>
                                            <div
                                                className={`relative flex items-center rounded-xl border bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 transition-all ${profileErrors.joiningDate
                                                    ? "border-error focus-within:border-error focus-within:ring-error/20"
                                                    : "border-outline-variant/40 focus-within:border-primary focus-within:ring-primary/20"
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    event
                                                </span>
                                                <input
                                                    id="joiningDate"
                                                    type="date"
                                                    value={profileForm.joiningDate}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            joiningDate: e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none"
                                                    required
                                                />
                                            </div>
                                            {profileErrors.joiningDate && (
                                                <p className="font-body-sm text-[11px] text-error">
                                                    {profileErrors.joiningDate}
                                                </p>
                                            )}
                                        </div>

                                        {/* Probation end date */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="probationEndDate"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Probation End Date
                                            </label>
                                            <div className="relative flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    hourglass_top
                                                </span>
                                                <input
                                                    id="probationEndDate"
                                                    type="date"
                                                    value={profileForm.probationEndDate}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            probationEndDate:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Reporting manager */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label
                                                htmlFor="reportingManager"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Reporting Manager
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="reportingManager"
                                                    value={profileForm.reportingManager}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            reportingManager:
                                                                e.target.value,
                                                        })
                                                    }
                                                    disabled={
                                                        !profileForm.branchId ||
                                                        managersLoading
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition-all cursor-pointer"
                                                >
                                                    <option value="">
                                                        {profileForm.branchId
                                                            ? "No reporting manager"
                                                            : "Select a branch first"}
                                                    </option>
                                                    {managers?.map((m) => (
                                                        <option
                                                            key={m._id}
                                                            value={m._id}
                                                        >
                                                            {m.name} — {m.email}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                                                    expand_more
                                                </span>
                                            </div>
                                            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                                Only managers belonging to the selected
                                                branch are listed.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-outline-variant/20" />

                                {/* Personal section */}
                                <div className="space-y-4">
                                    <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">
                                            person
                                        </span>
                                        Personal
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="dateOfBirth"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Date of Birth
                                            </label>
                                            <div className="relative flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    cake
                                                </span>
                                                <input
                                                    id="dateOfBirth"
                                                    type="date"
                                                    value={profileForm.dateOfBirth}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            dateOfBirth: e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="gender"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Gender
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="gender"
                                                    value={profileForm.gender}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            gender: e.target
                                                                .value as Gender | "",
                                                        })
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                                >
                                                    <option value="">
                                                        Prefer not to say
                                                    </option>
                                                    {(
                                                        Object.entries(
                                                            GENDER_LABELS
                                                        ) as [Gender, string][]
                                                    ).map(([k, v]) => (
                                                        <option key={k} value={k}>
                                                            {v}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="personalPhone"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Personal Phone
                                            </label>
                                            <div className="relative flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    call
                                                </span>
                                                <input
                                                    id="personalPhone"
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={profileForm.personalPhone}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            personalPhone:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="alternatePhone"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Alternate Phone
                                            </label>
                                            <div className="relative flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-xl text-on-surface-variant/60 mr-2.5">
                                                    phone_iphone
                                                </span>
                                                <input
                                                    id="alternatePhone"
                                                    type="tel"
                                                    placeholder="Optional"
                                                    value={profileForm.alternatePhone}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            alternatePhone:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label
                                                htmlFor="address"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Address
                                            </label>
                                            <textarea
                                                id="address"
                                                rows={2}
                                                placeholder="Street address"
                                                value={profileForm.address}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        address: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="city"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                City
                                            </label>
                                            <input
                                                id="city"
                                                type="text"
                                                value={profileForm.city}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        city: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="state"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                State
                                            </label>
                                            <input
                                                id="state"
                                                type="text"
                                                value={profileForm.state}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        state: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="country"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Country
                                            </label>
                                            <input
                                                id="country"
                                                type="text"
                                                value={profileForm.country}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        country: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="postalCode"
                                                className="block font-label-md text-xs font-medium text-on-surface-variant"
                                            >
                                                Postal Code
                                            </label>
                                            <input
                                                id="postalCode"
                                                type="text"
                                                value={profileForm.postalCode}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        postalCode: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        <div className="sm:col-span-2 pt-2 space-y-2">
                                            <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                                Emergency Contact
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label
                                                        htmlFor="emergencyContactName"
                                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                                    >
                                                        Name
                                                    </label>
                                                    <input
                                                        id="emergencyContactName"
                                                        type="text"
                                                        value={
                                                            profileForm.emergencyContactName
                                                        }
                                                        onChange={(e) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                emergencyContactName:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label
                                                        htmlFor="emergencyContactPhone"
                                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                                    >
                                                        Phone
                                                    </label>
                                                    <input
                                                        id="emergencyContactPhone"
                                                        type="tel"
                                                        value={
                                                            profileForm.emergencyContactPhone
                                                        }
                                                        onChange={(e) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                emergencyContactPhone:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label
                                                        htmlFor="emergencyContactRelation"
                                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                                    >
                                                        Relation
                                                    </label>
                                                    <input
                                                        id="emergencyContactRelation"
                                                        type="text"
                                                        placeholder="e.g. Spouse"
                                                        value={
                                                            profileForm.emergencyContactRelation
                                                        }
                                                        onChange={(e) =>
                                                            setProfileForm({
                                                                ...profileForm,
                                                                emergencyContactRelation:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-outline-variant/20" />

                                {/* Payroll */}
                                <div className="space-y-4">
                                    <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">
                                            payments
                                        </span>
                                        Salary Structure
                                    </p>
                                    <SalarySection
                                        salary={profileForm.salary}
                                        onChange={(next) =>
                                            setProfileForm({
                                                ...profileForm,
                                                salary: next,
                                            })
                                        }
                                    />
                                    {profileErrors.salary && (
                                        <p className="font-body-sm text-[11px] text-error">
                                            {profileErrors.salary}
                                        </p>
                                    )}
                                </div>

                                <hr className="border-outline-variant/20" />

                                {/* Bank details */}
                                <div className="space-y-4">
                                    <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">
                                            account_balance
                                        </span>
                                        Bank Details
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(
                                            [
                                                ["accountHolderName", "Account Holder"],
                                                ["accountNumber", "Account Number"],
                                                ["ifscCode", "IFSC Code"],
                                                ["bankName", "Bank Name"],
                                                ["branchName", "Branch Name"],
                                            ] as [keyof BankDetails, string][]
                                        ).map(([k, label]) => (
                                            <div className="space-y-1.5" key={k}>
                                                <label
                                                    htmlFor={`bank-${k}`}
                                                    className="block font-label-md text-xs font-medium text-on-surface-variant"
                                                >
                                                    {label}
                                                </label>
                                                <input
                                                    id={`bank-${k}`}
                                                    type="text"
                                                    value={profileForm.bank[k] ?? ""}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            bank: {
                                                                ...profileForm.bank,
                                                                [k]: e.target.value,
                                                            },
                                                        })
                                                    }
                                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-outline-variant/20" />

                                {/* Documents */}
                                <DocumentsSection
                                    documents={profileForm.documents}
                                    onChange={(next) =>
                                        setProfileForm({
                                            ...profileForm,
                                            documents: next,
                                        })
                                    }
                                />

                                <hr className="border-outline-variant/20" />

                                {/* Notes */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="notes"
                                        className="block font-label-md text-xs font-medium text-on-surface-variant"
                                    >
                                        Internal Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        placeholder="Private notes for HR (not shown to the employee)"
                                        value={profileForm.notes}
                                        onChange={(e) =>
                                            setProfileForm({
                                                ...profileForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                </div>

                                {/* Card-level Save */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/employees/${id}/profile`)}
                                        className="rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={profileSubmitting}
                                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {profileSubmitting
                                                ? "sync"
                                                : profileMode === "create"
                                                    ? "add_circle"
                                                    : "save"}
                                        </span>
                                        <span>
                                            {profileSubmitting
                                                ? "Saving..."
                                                : profileMode === "create"
                                                    ? "Create Profile"
                                                    : "Save Profile"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default EmployeeFormPage;