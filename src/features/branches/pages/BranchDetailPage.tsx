import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Can } from "@/components/Auth/Can";
import {
    useBranch,
    useBranchAttendanceConfig,
    useUpdateBranchStatus,
} from "../hooks/useBranches";
import { useAuthStore } from "@/store/auth.store";
import BranchHolidaysSection from "../components/BranchHolidaysSection";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BranchDetailPage = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const { id } = useParams<{ id: string }>();
    const { data: branch, isLoading, isFetching } = useBranch(id);
    const { data: attendanceData, isLoading: attendanceLoading } =
        useBranchAttendanceConfig(id);
    const updateStatus = useUpdateBranchStatus();

    const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

    const handleConfirmStatusChange = async () => {
        if (!branch) return;
        await updateStatus.mutateAsync({
            id: branch._id,
            isActive: !branch.isActive,
        });
        setConfirmStatusOpen(false);
    };

    if (isLoading && !branch) {
        return (
            <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                    progress_activity
                </span>
            </div>
        );
    }

    if (!isFetching && !branch) {
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

    if (!branch) return null;

    const config = attendanceData?.attendanceConfig;

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-5">
                <div className="space-y-1">
                    {
                        ( user?.role==='head' || user?.role==='admin' ) && (
                            <button
                        type="button"
                        onClick={() => navigate("/branches")}
                        className="flex items-center gap-1.5 font-label-md text-xs font-bold text-primary hover:underline mb-2"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Branches
                    </button>
                        )
                    }
                    <div className="flex items-center gap-3">
                        <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                            {branch.name}
                        </h1>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${branch.isActive
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-blue-500/10 text-blue-700"
                                }`}
                        >
                            {branch.isActive ? "Active" : "Setup Phase"}
                        </span>
                    </div>
                    <p className="font-mono text-xs font-bold text-on-surface-variant/70">
                        CODE: {branch.code}
                    </p>
                </div>

                <Can permission="branch:update">
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setConfirmStatusOpen(true)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-label-md text-xs font-bold transition-colors ${branch.isActive
                                ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">
                                {branch.isActive ? "toggle_off" : "toggle_on"}
                            </span>
                            <span>{branch.isActive ? "Deactivate" : "Activate"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/branches/${branch._id}/edit`)}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">edit</span>
                            <span>Edit Branch</span>
                        </button>
                    </div>
                </Can>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Location card */}
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6 shadow-sm space-y-4">
                    <h2 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">
                            location_on
                        </span>
                        Location & Contact
                    </h2>

                    {/* Updated responsive 4-column layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

                        {/* Full Address - Spans full width on tablet (2 cols), 1 col on desktop */}
                        <div className="sm:col-span-2 lg:col-span-1 rounded-xl bg-surface-container-low p-3 space-y-1">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-on-surface-variant">
                                Full Address
                            </p>
                            <p className="font-semibold text-on-surface truncate" title={[branch.address, branch.city, branch.state, branch.country].filter(Boolean).join(", ")}>
                                {[branch.address, branch.city, branch.state, branch.country]
                                    .filter(Boolean)
                                    .join(", ") || "Address not provided"}
                            </p>
                        </div>

                        {/* Phone */}
                        <div className="rounded-xl bg-surface-container-low p-3 space-y-1">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-on-surface-variant">
                                Phone
                            </p>
                            <p className="font-bold text-on-surface truncate">{branch.phone || "N/A"}</p>
                        </div>

                        {/* Email */}
                        <div className="rounded-xl bg-surface-container-low p-3 space-y-1">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-on-surface-variant">
                                Email
                            </p>
                            <p className="font-bold text-on-surface truncate" title={branch.email}>
                                {branch.email || "N/A"}
                            </p>
                        </div>

                        {/* Team Size */}
                        <div className="rounded-xl bg-surface-container-low p-3 space-y-1">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-on-surface-variant">
                                Team Size
                            </p>
                            <p className="font-bold text-on-surface">
                                {branch.teamSize ? `${branch.teamSize} Members` : "No staff recorded"}
                            </p>
                        </div>

                    </div>
                </div>


                {/* Attendance summary card */}
                <Can permission="branch-attendance:view">
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">
                                    fingerprint
                                </span>
                                Attendance Rules
                            </h2>
                            <button
                                type="button"
                                onClick={() => navigate(`/branches/${branch._id}/edit?tab=attendance`)}
                                className="font-label-md text-xs font-bold text-primary hover:underline"
                            >
                                Configure
                            </button>
                        </div>

                        {attendanceLoading ? (
                            <div className="h-10 rounded-lg bg-surface-container-high animate-pulse" />
                        ) : config ? (
                            <div className="flex flex-wrap gap-2 text-[11px]">
                                <span
                                    className={`rounded-full px-2.5 py-1 font-bold ${config.enabled
                                        ? "bg-emerald-500/10 text-emerald-700"
                                        : "bg-surface-container-high text-on-surface-variant"
                                        }`}
                                >
                                    {config.enabled ? "Enabled" : "Disabled"}
                                </span>
                                <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold text-on-surface-variant">
                                    {config.workingDays
                                        .slice()
                                        .sort((a, b) => a - b)
                                        .map((d) => DAY_LABELS[d])
                                        .join(", ") || "No working days set"}
                                </span>
                                <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold text-on-surface-variant">
                                    {config.workingHours.startTime}–{config.workingHours.endTime}
                                </span>
                                <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold text-on-surface-variant">
                                    {config.gracePeriodMinutes}m grace
                                </span>
                                <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold text-on-surface-variant">
                                    {config.timezone}
                                </span>
                            </div>
                        ) : (
                            <p className="font-body-sm text-xs text-on-surface-variant/70 italic">
                                Attendance settings haven't been configured yet.
                            </p>
                        )}
                    </div>
                </Can>

                {/* Holidays stub */}
                <div className="">
                    <BranchHolidaysSection branchId={branch._id} />
                </div>

                {/* Admin assignment note */}
                { user?.role !== "employee" &&
                    (
                        <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-xl">
                        admin_panel_settings
                    </span>
                    <p className="font-body-sm text-xs text-on-surface-variant flex-1">
                        Branch admins are assigned from the Employees directory, not here.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate(`/employees?branchId=${branch._id}`)}
                        className="font-label-md text-xs font-bold text-primary hover:underline shrink-0"
                    >
                        Go to Employees
                    </button>
                </div>
                    )
                }
            </div>

            <ConfirmDialog
                open={confirmStatusOpen}
                onClose={() => setConfirmStatusOpen(false)}
                onConfirm={handleConfirmStatusChange}
                isLoading={updateStatus.isPending}
                tone={branch.isActive ? "danger" : "primary"}
                title={branch.isActive ? "Deactivate Branch?" : "Activate Branch?"}
                description={
                    branch.isActive
                        ? `${branch.name} will stop appearing in active branch lists and new employees can no longer be assigned to it.`
                        : `${branch.name} will become available again for assignments.`
                }
                confirmLabel={branch.isActive ? "Deactivate" : "Activate"}
            />
        </div>
    );
};

export default BranchDetailPage;