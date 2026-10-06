import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import { Can } from "@/components/Auth/Can";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import { useEmployeesQuery } from "@/features/employees";
import type { LeadStatus } from "@/types/lead";
import {
    useLead,
    useLeadActivities,
    useLeadCallLogs,
    useLeadFollowUps,
    useUpdateLeadStatus,
    useAssignLead,
    useAddLeadRemark,
    useScheduleFollowUp,
    useCompleteFollowUp,
} from "../hooks/useLeads";
import { LeadCallHistory } from "@/features/dialer/components/LeadCallHistory";
import LeadWhatsAppPanel from "../components/LeadWhatsAppPanel";

const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = [
    { label: "New", value: "new" },
    { label: "Assigned", value: "assigned" },
    { label: "Contacted", value: "contacted" },
    { label: "Follow-up", value: "follow_up" },
    { label: "Interested", value: "interested" },
    { label: "Qualified", value: "qualified" },
    { label: "Converted", value: "converted" },
    { label: "Lost", value: "lost" },
    { label: "Closed", value: "closed" },
];

const STATUS_BADGE_CLASSES: Record<LeadStatus, string> = {
    new: "bg-indigo-500/10 text-indigo-700 border-indigo-200/40",
    assigned: "bg-sky-500/10 text-sky-700 border-sky-200/40",
    contacted: "bg-amber-500/10 text-amber-700 border-amber-200/40",
    follow_up: "bg-amber-500/10 text-amber-700 border-amber-200/40",
    interested: "bg-sky-500/10 text-sky-700 border-sky-200/40",
    qualified: "bg-emerald-500/10 text-emerald-700 border-emerald-200/40",
    converted: "bg-emerald-600 text-white border-transparent",
    lost: "bg-rose-500/10 text-rose-700 border-rose-200/40",
    closed: "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
};

const FOLLOW_UP_BADGE_CLASSES: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-700",
    COMPLETED: "bg-emerald-500/10 text-emerald-700",
    CANCELLED: "bg-surface-container-high text-on-surface-variant",
    MISSED: "bg-rose-500/10 text-rose-700",
};

const ACTIVITY_LABELS: Record<string, string> = {
    created: "Lead created",
    assigned: "Lead assigned",
    status_changed: "Status changed",
    remark_added: "Remark added",
    follow_up: "Follow-up activity",
    call_logged: "Call logged",
    whatsapp_in: "WhatsApp received",
    whatsapp_out: "WhatsApp sent",
};

const ACTIVITY_ICONS: Record<string, string> = {
    created: "add_circle",
    assigned: "assignment_ind",
    status_changed: "sync_alt",
    remark_added: "edit_note",
    follow_up: "event_upcoming",
    call_logged: "call",
    whatsapp_in: "chat",
    whatsapp_out: "send",
};

const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const SectionCard = ({
    title,
    icon,
    children,
    action,
}: {
    title: string;
    icon: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-label-md text-xs font-bold uppercase tracking-wider text-primary">
                <span className="material-symbols-outlined text-base">{icon}</span>
                {title}
            </h3>
            {action}
        </div>
        {children}
    </div>
);

const LeadDetailPage = () => {
    const { leadId } = useParams<{ leadId: string }>();
    const navigate = useNavigate();
    const currentUser = useAuthStore((s) => s.user);

    const { data: lead, isLoading, isError } = useLead(leadId);
    const { data: activities, isLoading: activitiesLoading } = useLeadActivities(leadId);
    const { data: callLogs, isLoading: callLogsLoading } = useLeadCallLogs(leadId);
    const { data: followUps, isLoading: followUpsLoading } = useLeadFollowUps(leadId);
    const location = useLocation();

    // Notifications about WhatsApp messages link to /leads/:id#whatsapp.
    useEffect(() => {
        if (!lead || location.hash !== "#whatsapp") return;
        document.getElementById("whatsapp")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [lead, location.hash]);

    const updateStatus = useUpdateLeadStatus();
    const assignLead = useAssignLead();
    const addRemark = useAddLeadRemark();
    const scheduleFollowUp = useScheduleFollowUp();
    const completeFollowUp = useCompleteFollowUp();

    const [statusForm, setStatusForm] = useState<{ status: LeadStatus | ""; remark: string }>({
        status: "",
        remark: "",
    });
    const [assigneeId, setAssigneeId] = useState("");
    const [remarkText, setRemarkText] = useState("");
    const [followUpForm, setFollowUpForm] = useState({ scheduledAt: "", remark: "" });
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [completeRemark, setCompleteRemark] = useState("");

    const branchId = useMemo(() => {
        if (!lead) return undefined;
        return typeof lead.branch === "object" ? lead.branch?._id : lead.branch;
    }, [lead]);

    const assignedToId =
        lead?.assignedTo && typeof lead.assignedTo === "object"
            ? lead.assignedTo._id
            : lead?.assignedTo;

    // Real employee accounts (User records), branch-scoped, active only — the
    // shape assignLead actually expects (employeeId === User._id).
    const { data: branchEmployees, isLoading: employeesLoading } = useEmployeesQuery({
        role: ROLES.EMPLOYEE,
        branchId: branchId ? String(branchId) : undefined,
        isActive: true,
        limit: 100,
    });

    const handleUpdateStatus = async () => {
        if (!leadId || !statusForm.status) return;
        await updateStatus.mutateAsync({
            id: leadId,
            payload: {
                status: statusForm.status,
                remark: statusForm.remark.trim() || undefined,
            },
        });
        setStatusForm({ status: "", remark: "" });
    };

    const handleAssign = async () => {
        if (!leadId || !assigneeId) return;
        await assignLead.mutateAsync({ id: leadId, payload: { employeeId: assigneeId } });
        setAssigneeId("");
    };

    const handleAddRemark = async () => {
        if (!leadId || !remarkText.trim()) return;
        await addRemark.mutateAsync({ id: leadId, payload: { remark: remarkText.trim() } });
        setRemarkText("");
    };

    const handleScheduleFollowUp = async () => {
        if (!leadId || !followUpForm.scheduledAt) return;
        await scheduleFollowUp.mutateAsync({
            id: leadId,
            payload: {
                scheduledAt: new Date(followUpForm.scheduledAt).toISOString(),
                remark: followUpForm.remark.trim() || undefined,
            },
        });
        setFollowUpForm({ scheduledAt: "", remark: "" });
    };

    const handleCompleteFollowUp = async (followUpId: string) => {
        if (!completeRemark.trim()) return;
        await completeFollowUp.mutateAsync({
            followUpId,
            payload: { remark: completeRemark.trim() },
        });
        setCompletingId(null);
        setCompleteRemark("");
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                    progress_activity
                </span>
            </div>
        );
    }

    if (isError || !lead) {
        return (
            <div className="flex min-h-96 flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-4xl text-error">
                    person_off
                </span>
                <p className="font-body-md text-sm text-on-surface-variant">
                    This lead could not be found, or you don't have access to it.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/leads")}
                    className="rounded-xl border border-outline-variant/40 px-4 py-2 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                    Back to Leads
                </button>
            </div>
        );
    }

    const branchLabel = typeof lead.branch === "object" ? lead.branch?.name : null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="shrink-0 rounded-lg border border-outline-variant/30 p-2 hover:bg-surface-container-low transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-headline-sm text-xl sm:text-2xl font-bold text-on-surface truncate">
                                {lead.name}
                            </h1>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase shrink-0 ${STATUS_BADGE_CLASSES[lead.status]}`}
                            >
                                {lead.status.replace("_", " ")}
                            </span>
                        </div>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                            Created {formatDateTime(lead.createdAt)}
                            {branchLabel && <> • {branchLabel}</>}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    {/* WhatsApp only for leads linked to a WATI integration. */}
                    {lead.integration && (
                        <a
                            href="#whatsapp"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById("whatsapp")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/40 px-4 py-2.5 font-label-md text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            WhatsApp
                        </a>
                    )}
                    {lead.phone && (
                        <Link
                            to={`/dialer?leadId=${lead._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">call</span>
                            Call Lead
                        </Link>
                    )}
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Operations */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Card */}
                    <SectionCard title="Lead Contact & Context" icon="badge">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                                <span className="text-on-surface-variant/70 font-semibold block">Phone</span>
                                <span className="font-bold text-on-surface">
                                    {lead.phoneCountryCode} {lead.phone}
                                </span>
                            </div>
                            <div>
                                <span className="text-on-surface-variant/70 font-semibold block">Email</span>
                                <span className="font-bold text-on-surface">{lead.email || "—"}</span>
                            </div>
                            <div>
                                <span className="text-on-surface-variant/70 font-semibold block">City</span>
                                <span className="font-bold text-on-surface">{lead.city || "—"}</span>
                            </div>
                            <div>
                                <span className="text-on-surface-variant/70 font-semibold block">Industry</span>
                                <span className="font-bold text-on-surface">{lead.industry || "—"}</span>
                            </div>
                            <div>
                                <span className="text-on-surface-variant/70 font-semibold block">Source</span>
                                <span className="font-bold text-on-surface">{lead.source}</span>
                            </div>
                            <div>
                                <span className="text-on-surface-variant/70 font-semibold block">Created By</span>
                                <span className="font-bold text-on-surface">
                                    {typeof lead.createdBy === "object" ? lead.createdBy.name : "—"}
                                </span>
                            </div>
                        </div>
                        {lead.message && (
                            <div className="rounded-xl bg-surface-container-low px-3.5 py-2.5">
                                <span className="text-on-surface-variant/70 font-semibold text-[11px] uppercase tracking-wider block mb-1">
                                    Original Message
                                </span>
                                <p className="text-xs text-on-surface">{lead.message}</p>
                            </div>
                        )}
                    </SectionCard>

                    {lead.integration && (
                        <div id="whatsapp" className="scroll-mt-24">
                            <SectionCard title="WhatsApp" icon="chat">
                                <LeadWhatsAppPanel leadId={lead._id} leadName={lead.name} />
                            </SectionCard>
                        </div>
                    )}

                    <SectionCard title="Assignment Details" icon="group">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Assigned Branch Card */}
                            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 transition-colors">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-xl">corporate_fare</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                                        Assigned Branch
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-xs font-bold text-on-surface">
                                            {lead.branch?.name ?? "—"}
                                        </p>
                                        {lead.branch?.code && (
                                            <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                                                {lead.branch?.code}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Employee Card */}
                            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 transition-colors">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-xl">person_pin</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                                        Assigned Person
                                    </span>
                                    {lead.assignedTo ? (
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="truncate text-xs font-bold text-on-surface">
                                                    {lead.assignedTo?.name}
                                                </p>
                                                <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold uppercase text-primary">
                                                    {lead.assignedTo.role}
                                                </span>
                                            </div>
                                            <p className="truncate text-[11px] font-medium text-on-surface-variant/80">
                                                {lead.assignedTo.email}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-on-surface-variant">Unassigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Status & Assignment Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Can permission="lead:update">
                            <SectionCard title="Update Pipeline Stage" icon="sync_alt">
                                <select
                                    value={statusForm.status}
                                    onChange={(e) =>
                                        setStatusForm((p) => ({ ...p, status: e.target.value as LeadStatus }))
                                    }
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
                                >
                                    <option value="">Select Status…</option>
                                    {STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Optional remark about this change"
                                    value={statusForm.remark}
                                    onChange={(e) => setStatusForm((p) => ({ ...p, remark: e.target.value }))}
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={handleUpdateStatus}
                                    disabled={!statusForm.status || updateStatus.isPending}
                                    className="w-full rounded-xl bg-primary py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                                >
                                    {updateStatus.isPending ? "Updating…" : "Update"}
                                </button>
                            </SectionCard>
                        </Can>

                        <Can permission="lead:assign">
                            <SectionCard title="Reassign Lead" icon="assignment_ind">
                                {assignedToId && typeof lead.assignedTo === "object" && (
                                    <p className="font-body-sm text-xs text-on-surface-variant">
                                        Currently assigned to{" "}
                                        <span className="font-bold text-on-surface">{lead.assignedTo.name}</span>
                                    </p>
                                )}
                                <select
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    disabled={employeesLoading}
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface outline-none focus:border-primary disabled:opacity-60"
                                >
                                    <option value="">
                                        {employeesLoading ? "Loading employees…" : "Select Employee…"}
                                    </option>
                                    {branchEmployees?.employees
                                        .filter((emp) => emp._id !== assignedToId)
                                        .map((emp) => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.email})
                                            </option>
                                        ))}
                                </select>
                                {branchEmployees && branchEmployees.employees.length === 0 && (
                                    <p className="font-body-sm text-[11px] text-on-surface-variant/70 italic">
                                        No active employees in this lead's branch yet.
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={!assigneeId || assignLead.isPending}
                                    className="w-full rounded-xl bg-primary py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                                >
                                    {assignLead.isPending ? "Assigning…" : "Assign"}
                                </button>
                            </SectionCard>
                        </Can>
                    </div>

                    {/* Remarks Card */}
                    <Can permission="lead:update">
                        <SectionCard title="Remarks" icon="edit_note">
                            {lead.remarks && (
                                <p className="rounded-xl bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface-variant italic">
                                    "{lead.remarks}"
                                </p>
                            )}
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="text"
                                    placeholder="Write a remark…"
                                    value={remarkText}
                                    onChange={(e) => setRemarkText(e.target.value)}
                                    className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddRemark}
                                    disabled={!remarkText.trim() || addRemark.isPending}
                                    className="rounded-xl bg-primary px-4 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all whitespace-nowrap"
                                >
                                    {addRemark.isPending ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </SectionCard>
                    </Can>

                    {/* Follow-up Section */}
                    <SectionCard title="Scheduled Follow-ups" icon="event_upcoming">
                        <Can permission="lead:update">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="datetime-local"
                                    value={followUpForm.scheduledAt}
                                    onChange={(e) => setFollowUpForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                                    className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={handleScheduleFollowUp}
                                    disabled={!followUpForm.scheduledAt || scheduleFollowUp.isPending}
                                    className="rounded-xl bg-primary px-4 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all whitespace-nowrap"
                                >
                                    {scheduleFollowUp.isPending ? "Scheduling…" : "Schedule"}
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Optional note for this follow-up"
                                value={followUpForm.remark}
                                onChange={(e) => setFollowUpForm((p) => ({ ...p, remark: e.target.value }))}
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-sm text-xs text-on-surface outline-none focus:border-primary"
                            />
                        </Can>

                        <div className="space-y-2 pt-1">
                            {followUpsLoading ? (
                                <div className="h-10 animate-pulse rounded-xl bg-surface-container-high" />
                            ) : !followUps || followUps.length === 0 ? (
                                <p className="font-body-sm text-[11px] text-on-surface-variant/70 italic">
                                    No follow-ups scheduled yet.
                                </p>
                            ) : (
                                followUps.map((fu) => {
                                    const fuAssigneeId =
                                        typeof fu.assignedTo === "object" ? fu.assignedTo._id : fu.assignedTo;
                                    const canComplete =
                                        fu.status === "PENDING" && currentUser?._id === fuAssigneeId;

                                    return (
                                        <div
                                            key={fu._id}
                                            className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3.5 space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-body-sm text-xs font-bold text-on-surface">
                                                    {formatDateTime(fu.scheduledAt)}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 font-label-sm text-[10px] font-bold ${FOLLOW_UP_BADGE_CLASSES[fu.status]}`}
                                                >
                                                    {fu.status}
                                                </span>
                                            </div>
                                            {fu.remark && (
                                                <p className="font-body-sm text-[11px] text-on-surface-variant">
                                                    {fu.remark}
                                                </p>
                                            )}
                                            {canComplete &&
                                                (completingId === fu._id ? (
                                                    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            placeholder="Completion remark…"
                                                            value={completeRemark}
                                                            onChange={(e) => setCompleteRemark(e.target.value)}
                                                            className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2.5 py-1.5 font-body-sm text-[11px] text-on-surface outline-none focus:border-primary"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCompleteFollowUp(fu._id)}
                                                                disabled={!completeRemark.trim() || completeFollowUp.isPending}
                                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-label-sm text-[11px] font-bold text-white disabled:opacity-50"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCompletingId(null);
                                                                    setCompleteRemark("");
                                                                }}
                                                                className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label-sm text-[11px] font-bold text-on-surface-variant"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCompletingId(fu._id)}
                                                        className="font-label-sm text-[11px] font-bold text-primary hover:underline"
                                                    >
                                                        Mark complete
                                                    </button>
                                                ))}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </SectionCard>

                    {/* Call History — backend doesn't gate this route by permission, so no Can wrapper */}
                    <SectionCard title="Call History" icon="call">
                        {callLogsLoading ? (
                            <div className="h-10 animate-pulse rounded-xl bg-surface-container-high" />
                        ) : callLogs?.length ? (
                            callLogs.map((call) => (
                                <div
                                    key={call._id}
                                    className="flex items-center justify-between rounded-xl border border-outline-variant/20 p-3 text-xs"
                                >
                                    <div>
                                        <p className="font-bold capitalize text-on-surface">
                                            {call.callStatus ?? "Call"}
                                        </p>
                                        <p className="text-on-surface-variant">
                                            {call.fromNumber ?? "Unknown"} → {call.toNumber ?? "Unknown"}
                                        </p>
                                    </div>
                                    <div className="text-right text-on-surface-variant">
                                        <p>{call.duration ?? 0}s</p>
                                        <p>{formatDateTime(call.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="font-body-sm text-[11px] text-on-surface-variant/70 italic">
                                No calls recorded for this lead.
                            </p>
                        )}
                    </SectionCard>
                </div>

                {/* Right Column: Activity Stream */}
                <SectionCard title="Activity Timeline" icon="history">
                    {activitiesLoading ? (
                        <div className="h-16 animate-pulse rounded-xl bg-surface-container-high" />
                    ) : !activities || activities.length === 0 ? (
                        <p className="font-body-sm text-[11px] text-on-surface-variant/70 italic">
                            No activity recorded yet.
                        </p>
                    ) : (
                        <div className="space-y-4 relative before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-outline-variant/30">
                            <div className="relative border-l-2 border-outline-variant/30 pl-6 pb-6 last:pb-0 last:border-l-transparent space-y-4">                            {activities.map((act) => (
                                <div key={act._id} className="relative group">
                                    {/* Dynamic Status/Activity Node Badge */}
                                    <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-primary shadow-xs group-hover:border-primary transition-colors">
                                        <span className="material-symbols-outlined !text-[16px] leading-none">
                                            {ACTIVITY_ICONS[act.activityType] ?? "circle"}
                                        </span>
                                    </span>

                                    {/* Main Container */}
                                    <div className="space-y-1.5">
                                        {/* Header: Action Type & User */}
                                        <div className=" gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                                                <span>{ACTIVITY_LABELS[act.activityType] ?? act.activityType}</span>
                                                <span className="text-on-surface-variant/40">•</span>
                                                <span className="font-semibold text-on-surface-variant">
                                                    {act.performedBy?.name ?? "System"}
                                                </span>
                                            </div>
                                            <time className="text-[10px] font-medium text-on-surface-variant/60 shrink-0">
                                                {formatDateTime(act.createdAt)}
                                            </time>
                                        </div>

                                        {/* Status Transition Pills */}
                                        {act.previousStatus && act.newStatus && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-[11px]">
                                                    {act.previousStatus}
                                                </span>
                                                <span className="material-symbols-outlined text-xs text-on-surface-variant/60">
                                                    east
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px]">
                                                    {act.newStatus}
                                                </span>
                                            </div>
                                        )}

                                        {/* Remark / Note Block */}
                                        {act.remark && (
                                            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2.5 text-xs font-medium text-on-surface-variant shadow-2xs">
                                                "{act.remark}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </SectionCard>
            </div>
            <div className="col-span-4">
                {
                    leadId && (
                        <LeadCallHistory leadId={leadId} />

                    )
                }
            </div>


            <div className="pt-2">
                <Link to="/leads" className="font-label-md text-xs font-bold text-primary hover:underline">
                    ← Back to Lead Management Hub
                </Link>
            </div>
        </div>
    );
};

export default LeadDetailPage;