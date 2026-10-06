import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Can } from "@/components/Auth/Can";
import { useEmployeeProfileByUserQuery, useEmployeeQuery } from "../hooks/useEmployees";
import ResetPasswordButton from "../components/ResetPasswordButton";
import { PERMISSIONS, ROLE_LABELS } from "@/types/auth";

const getInitials = (name?: string) =>
  name
    ? name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "??";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<
    "overview" | "personal" | "documents" | "payroll"
  >("overview");

  // The HR profile (EmployeeProfile) — optional, may not exist yet.
  const { data: profile, isLoading: profileLoading } = useEmployeeProfileByUserQuery(id);

  // The underlying account (User) — this is what the row in the directory
  // actually links to, so it should always resolve if the link was valid.
  const { data: user, isLoading: userLoading } = useEmployeeQuery(id);

  // Helper safe resolvers for populated references
  const getUserObj = () =>
    profile && typeof profile?.user === "object" ? profile?.user : null;
  const getBranchObj = () =>
    profile && typeof profile?.branch === "object" ? profile?.branch : null;
  const getManagerObj = () =>
    profile && typeof profile?.reportingManager === "object"
      ? profile?.reportingManager
      : null;

  const userObj = getUserObj();
  const branchObj = getBranchObj();
  const managerObj = getManagerObj();

  const isLoading = profileLoading || userLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex items-center gap-2 font-body-md text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading employee profile?...
        </div>
      </div>
    );
  }

  // Truly nothing to show — the account itself doesn't exist (bad link,
  // deleted user, or no access).
  if (!profile && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
        <span className="material-symbols-outlined text-4xl text-outline-variant">
          person_off
        </span>
        <p className="font-body-md text-on-surface-variant">This employee account could not be found.</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-primary/10 px-4 py-2 font-label-md text-xs font-bold text-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  // The account exists, but no HR profile has been created for it yet.
  // Rather than a dead-end 404, show what we do have (their account) and
  // offer a clear next step instead of pretending the person doesn't exist.
  if (!profile && user) {
    return (
      <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 font-label-md text-xs font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Employees
          </button>

          <div className="flex items-center gap-3">
            <ResetPasswordButton
              userId={user._id}
              userName={user.name}
              targetRole={user.role}
            />

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${user.isActive
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-surface-container-high text-on-surface-variant"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-outline"}`}
              />
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Account header — everything we know from the User record */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-headline-md text-2xl font-bold">
                {getInitials(user.name)}
              </div>
              <div>
                <h1 className="font-headline-md text-2xl font-extrabold text-on-surface">
                  {user.name}
                </h1>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface">
                    {ROLE_LABELS[user.role]}
                  </span>
                  {user.branches.length > 0 ? (
                    user.branches.map((b) => (
                      <span
                        key={b._id}
                        className="rounded-lg bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] font-bold text-on-surface-variant"
                      >
                        {b.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] font-bold text-on-surface-variant/60 italic">
                      No branch assigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3 text-center min-w-32">
              <span className="block font-label-sm text-[10px] uppercase font-bold text-on-surface-variant">
                Account Created
              </span>
              <span className="font-bold text-xs text-on-surface">
                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Empty state — HR profile not created yet */}
        <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-8 sm:p-10 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-2xl">badge</span>
          </div>
          <h2 className="font-headline-sm text-lg font-bold text-on-surface">
            No profile yet
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant max-w-md mx-auto">
            {user.name}'s account is active, but the employee HR profile has not been
            created. An Employee ID is required to make {user.name} functional in the
            CRM. Other HR details such as designation, salary, and bank details can be
            added later as needed.
          </p>

          <p className="mt-2 font-medium text-amber-600 dark:text-amber-400">
            Please complete the HR profile to activate {user.name}'s employee
            functionality.
          </p>
          <Can permission={PERMISSIONS.EMPLOYEE_CREATE}>
            <button
              type="button"
              onClick={() => navigate(`/employees/${id}/edit`, { state: { tab: "profile" } })}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all mt-2"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Add HR Profile Details</span>
            </button>
          </Can>
        </div>
      </div>
    );
  }

  // From here on, `profile` is guaranteed to exist — original detailed view.
  return (
    <div className="min-h-screen relative bg-surface pb-28 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-label-md text-xs font-bold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Employees
        </button>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${profile?.employmentStatus === "active"
            ? "bg-emerald-500/10 text-emerald-700"
            : "bg-error/10 text-error"
            }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${profile?.employmentStatus === "active" ? "bg-emerald-500" : "bg-error"
              }`}
          />
          {profile?.employmentStatus}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-headline-md text-2xl font-bold">
              {userObj?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "EP"}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-headline-md text-2xl font-extrabold text-on-surface">
                  {userObj?.name || "Employee Profile"}
                </h1>
                <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-mono text-xs font-bold text-on-surface">
                  #{profile?.employeeCode}
                </span>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                {profile?.designation || "No Designation"} • {profile?.department || "General"}
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant/70 mt-1">
                {userObj?.email} • {profile?.personalPhone || "Phone not available"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 border-outline-variant/20 pt-4 md:pt-0 w-full md:w-auto">
            <div className="rounded-xl bg-surface-container-low p-3 text-center min-w-24 flex-1 md:flex-initial">
              <span className="block font-label-sm text-[10px] uppercase font-bold text-on-surface-variant">
                Branch
              </span>
              <span className="font-bold text-xs text-on-surface">
                {branchObj?.name || "N/A"}
              </span>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3 text-center min-w-24 flex-1 md:flex-initial">
              <span className="block font-label-sm text-[10px] uppercase font-bold text-on-surface-variant">
                Type
              </span>
              <span className="font-bold text-xs text-on-surface capitalize">
                {profile?.employmentType?.toLowerCase().replace("_", " ")}
              </span>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3 text-center min-w-24 flex-1 md:flex-initial">
              <span className="block font-label-sm text-[10px] uppercase font-bold text-on-surface-variant">
                Joined
              </span>
              <span className="font-bold text-xs text-on-surface">
                { profile?.joiningDate && new Date(profile?.joiningDate).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 overflow-x-auto gap-6 pt-2">
          {[
            { id: "overview", label: "Overview & Work", icon: "badge", permission: [PERMISSIONS.USER_VIEW, PERMISSIONS.EMPLOYEE_VIEW] },
            { id: "personal", label: "Personal & Emergency", icon: "person", permission: [PERMISSIONS.USER_VIEW, PERMISSIONS.EMPLOYEE_VIEW] },
            { id: "documents", label: `Documents (${profile?.documents?.length || 0})`, icon: "folder_open", permission: [PERMISSIONS.EMPLOYEE_DOCUMENT_VIEW] },
            { id: "payroll", label: "Salary & Banking", icon: "payments", permission: [PERMISSIONS.EMPLOYEE_SALARY_VIEW] },
          ].map((tab) => (
            <Can permission={tab.permission} key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 font-label-md text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </Can>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employment Details */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">work</span>
              Employment & Role Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Employee Code</span>
                <p className="font-bold text-on-surface font-mono mt-0.5">{profile?.employeeCode}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Department</span>
                <p className="font-bold text-on-surface mt-0.5">{profile?.department || "N/A"}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Designation</span>
                <p className="font-bold text-on-surface mt-0.5">{profile?.designation || "N/A"}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Reporting Manager</span>
                <p className="font-bold text-on-surface mt-0.5">{managerObj?.name || "None"}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Joining Date</span>
                <p className="font-bold text-on-surface mt-0.5">
                  {profile?.joiningDate && new Date(profile?.joiningDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Probation End Date</span>
                <p className="font-bold text-on-surface mt-0.5">
                  {profile?.probationEndDate
                    ? new Date(profile?.probationEndDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Account System Info */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">laptop</span>
              System Meta
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">System Role</span>
                <p className="font-bold text-on-surface capitalize mt-0.5">
                  {userObj?.role?.replace("_", " ") || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Assigned Branch</span>
                <p className="font-bold text-on-surface mt-0.5">{branchObj?.name || "Unassigned"}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Record Created At</span>
                <p className="font-medium text-on-surface mt-0.5">
                  { profile?.createdAt && new Date(profile?.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Last Updated</span>
                <p className="font-medium text-on-surface mt-0.5">
                  { profile?.updatedAt && new Date(profile?.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
            {profile?.notes && (
              <div className="mt-4 pt-3 border-t border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-xs">Notes:</span>
                <p className="text-xs text-on-surface mt-1 bg-surface-container-low p-2.5 rounded-xl italic">
                  "{profile?.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">person</span>
              Personal Info & Address
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Date of Birth</span>
                <p className="font-bold text-on-surface mt-0.5">
                  {profile?.dateOfBirth
                    ? new Date(profile?.dateOfBirth).toLocaleDateString("en-IN")
                    : "Not provided"}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Gender</span>
                <p className="font-bold text-on-surface capitalize mt-0.5">
                  {profile?.gender?.toLowerCase() || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Personal Phone</span>
                <p className="font-bold text-on-surface mt-0.5">{profile?.personalPhone || "N/A"}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Alternate Phone</span>
                <p className="font-bold text-on-surface mt-0.5">{profile?.alternatePhone || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-on-surface-variant font-medium">Address</span>
                <p className="font-semibold text-on-surface mt-0.5">
                  {[profile?.address, profile?.city, profile?.state, profile?.postalCode, profile?.country]
                    .filter(Boolean)
                    .join(", ") || "Address details not available."}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">e911_emergency</span>
              Emergency Contact
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Contact Name</span>
                <p className="font-bold text-on-surface mt-0.5">
                  {profile?.emergencyContactName || "Not assigned"}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Relationship</span>
                <p className="font-bold text-on-surface mt-0.5">
                  {profile?.emergencyContactRelation || "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-on-surface-variant font-medium">Emergency Phone</span>
                <p className="font-bold text-on-surface mt-0.5">
                  {profile?.emergencyContactPhone || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Can permission={[PERMISSIONS.EMPLOYEE_DOCUMENT_VIEW]}>
        {activeTab === "documents" && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">folder</span>
              Attached Documents
            </h3>
            {profile?.documents && profile?.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile?.documents.map((doc, idx) => (
                  <div
                    key={doc?._id || idx}
                    className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low p-3.5"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-2xl text-primary shrink-0">
                        description
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-xs text-on-surface truncate">{doc.documentType}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-semibold">
                          {doc.documentType}
                        </p>
                      </div>
                    </div>
                    {doc.documentUrl && (
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-4">No documents uploaded for this profile?.</p>
            )}
          </div>
        )}
      </Can>

      <Can permission={[PERMISSIONS.EMPLOYEE_SALARY_VIEW]}>
        {activeTab === "payroll" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Salary Structure */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">payments</span>
                Salary Information
              </h3>

              {/* Main Key Metrics */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-on-surface-variant font-medium block">Gross Salary</span>
                  <p className="font-mono text-sm font-bold text-on-surface mt-0.5">
                    ₹{profile?.salary?.grossSalary?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <span className="text-emerald-700 font-medium block">Net Take-Home</span>
                  <p className="font-mono text-sm font-bold text-emerald-800 mt-0.5">
                    ₹{profile?.salary?.netSalary?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-on-surface-variant font-medium block">Basic Salary</span>
                  <p className="font-mono text-sm font-bold text-on-surface mt-0.5">
                    ₹{profile?.salary?.basic?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
              </div>

              {/* Accordion for Complete Salary Breakdown */}
              <details className="group border-t border-outline-variant/20 pt-3">
                <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-primary hover:underline list-none select-none">
                  <span>View Complete Salary Breakdown</span>
                  <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Earnings Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block border-b border-emerald-500/20 pb-1">
                      Earnings
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Basic</span>
                        <span className="font-mono font-medium">₹{profile?.salary?.basic?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">HRA</span>
                        <span className="font-mono font-medium">₹{profile?.salary?.hra?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Conveyance</span>
                        <span className="font-mono font-medium">₹{profile?.salary?.conveyance?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Medical Allowance</span>
                        <span className="font-mono font-medium">₹{profile?.salary?.medicalAllowance?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Special Allowance</span>
                        <span className="font-mono font-medium">₹{profile?.salary?.specialAllowance?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Other Allowance</span>
                        <span className="font-mono font-medium">₹{profile?.salary?.otherAllowance?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-error block border-b border-error/20 pb-1">
                      Deductions
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">PF Deduction</span>
                        <span className="font-mono font-medium text-error">-₹{profile?.salary?.pfDeduction?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">ESI Deduction</span>
                        <span className="font-mono font-medium text-error">-₹{profile?.salary?.esiDeduction?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Professional Tax</span>
                        <span className="font-mono font-medium text-error">-₹{profile?.salary?.professionalTax?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Other Deductions</span>
                        <span className="font-mono font-medium text-error">-₹{profile?.salary?.otherDeduction?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Bank Details */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">account_balance</span>
                Banking Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-on-surface-variant font-medium">Bank Name</span>
                  <p className="font-bold text-on-surface mt-0.5">{profile?.bankDetails?.bankName || "N/A"}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium">Account Number</span>
                  <p className="font-mono font-bold text-on-surface mt-0.5">
                    {profile?.bankDetails?.accountNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium">IFSC Code</span>
                  <p className="font-mono font-bold text-on-surface uppercase mt-0.5">
                    {profile?.bankDetails?.ifscCode || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium">Account Holder</span>
                  <p className="font-bold text-on-surface mt-0.5">
                    {profile?.bankDetails?.accountHolderName || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Can>

      {/* Floating Bottom Action Bar */}
      <Can permission={[PERMISSIONS.USER_UPDATE, PERMISSIONS.EMPLOYEE_UPDATE]}>
        <div className="sticky bottom-4 left-4 right-4 max-w-7xl mx-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md p-4 shadow-lg z-20">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant hidden sm:block">
              Need to update {userObj?.name || "this user"}'s role, branch, or employment status?
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <ResetPasswordButton
                userId={userObj?._id ?? id}
                userName={userObj?.name}
                targetRole={userObj?.role ?? user?.role}
              />

              <button
                type="button"
                onClick={() => navigate(`/employees/${id}/edit`)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                <span>Edit Employee Profile</span>
              </button>
            </div>
          </div>
        </div>
      </Can>
    </div>
  );
};

export default UserProfilePage;