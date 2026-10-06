import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Can } from "@/components/Auth/Can";
import RefreshButton from "@/components/ui/RefreshButton";
import { useAuthStore } from "@/store/auth.store";
import { PERMISSIONS, ROLES } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchesQuery } from "@/features/branches";
import { useEmployeeProfilesQuery, useEmployeesQuery } from "@/features/employees";
import type { RevenueRecord, RevenueStatus, RevenueViewMode } from "@/types/revenue";
import {
    useRevenueReportQuery,
    useUpdateRevenueStatusMutation,
} from "../hooks/useRevenue";
import { useLeads } from "@/features/leads";
import EditRevenueModal from "../components/EditRevenueModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STATUS_BADGE: Record<RevenueStatus, string> = {
    PENDING: "bg-amber-500/10 text-amber-700",
    VERIFIED: "bg-emerald-500/10 text-emerald-700",
    REJECTED: "bg-rose-500/10 text-rose-700",
};

interface LeadItem {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    source?: string;
}

const RevenuePage = () => {
    const currentUser = useAuthStore((s) => s.user);
    const isManager = currentUser?.role === ROLES.MANAGER;
    const canManage = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.HEAD;

    const [viewMode, setViewMode] = useState<RevenueViewMode>("");
    const [branchId, setBranchId] = useState("");
    const [selectedLeadId, setSelectedLeadId] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [selectedManagerId, setSelectedManagerId] = useState("");
    const [statusFilter, setStatusFilter] = useState<RevenueStatus | "">("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Employee combobox search state for INDIVIDUAL mode
    const [empSearchQuery, setEmpSearchQuery] = useState("");
    const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
    const empDropdownRef = useRef<HTMLDivElement>(null);

    const { data: branches } = useBranchesQuery();
    // Manager: only their direct reports — the backend rejects anyone else
    // with a 403. Admin/Head: company-wide list (100 is the API's max page).
    const { data: employeesData } = useEmployeesQuery(
        { limit: 100 },
        { enabled: canManage }
    );
    const { data: teamProfilesData } = useEmployeeProfilesQuery(
        { reportingManager: currentUser?._id, limit: 100 },
        { enabled: isManager && !!currentUser?._id }
    );
    const employees = useMemo(() => {
        if (isManager) {
            return (teamProfilesData?.profiles ?? []).map((p) => ({
                _id: p.user._id,
                name: p.user.name,
                email: p.user.email,
                role: p.user.role,
            }));
        }
        return employeesData?.employees ?? [];
    }, [isManager, teamProfilesData, employeesData]);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: leadsData, isLoading: isLeadLoading } = useLeads();
    const leads: LeadItem[] = leadsData?.leads ?? [];
    const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);


    // Filter leads dynamically based on search query
    const filteredLeads = useMemo(() => {
        if (!searchQuery.trim()) return leads;
        const q = searchQuery.toLowerCase();
        return leads.filter(
            (l) =>
                l.name.toLowerCase().includes(q) ||
                (l.phone && l.phone.includes(q)) ||
                (l.email && l.email.toLowerCase().includes(q))
        );
    }, [leads, searchQuery]);

    // Filter manager options for TEAM view
    const managers = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        return employees.filter(
            (emp: any) =>
                emp.role === "manager"
        );
    }, [employees]);

    // Search filter for INDIVIDUAL employee combobox
    const filteredEmployees = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        if (!empSearchQuery.trim()) return employees;
        const q = empSearchQuery.toLowerCase();
        return employees.filter(
            (e: any) =>
                e.name?.toLowerCase().includes(q) ||
                e.email?.toLowerCase().includes(q)
        );
    }, [employees, empSearchQuery]);

    // Close employee combobox on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) {
                setIsEmpDropdownOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsLeadDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Manager: default to their own team rather than the blank/unscoped
    // view — computed, never stored, so there's no state to fall out of
    // sync (mirrors ManagementDashboard's `resolvedViewMode`).
    const effectiveViewMode: RevenueViewMode =
        viewMode === "" && isManager ? "TEAM" : viewMode;

    const canFetchRevenue =
    effectiveViewMode === "" ||
    (effectiveViewMode === "BRANCH" && branchId !== "") ||
    (effectiveViewMode === "INDIVIDUAL" && selectedEmployeeId !== "") ||
    (effectiveViewMode === "LEAD" && selectedLeadId !== "") ||
    (effectiveViewMode === "TEAM" && (isManager || selectedManagerId !== ""));

    const { data, isLoading, isError } = useRevenueReportQuery(
    {
        // "All" = everything the user's role may see (Head: company, Admin:
        // their branches, Manager: their team, Employee: own entries)
        viewMode: effectiveViewMode || "ALL",

        branchId:
            effectiveViewMode === "BRANCH"
                ? branchId || undefined
                : undefined,

        employeeId:
            effectiveViewMode === "INDIVIDUAL"
                ? selectedEmployeeId || undefined
                : effectiveViewMode === "TEAM"
                    ? (isManager ? currentUser?._id : selectedManagerId) || undefined
                    : undefined,

        leadId:
            effectiveViewMode === "LEAD"
                ? selectedLeadId || undefined
                : undefined,

        status: statusFilter || undefined,

        startDate: dateFrom
            ? new Date(dateFrom).toISOString()
            : undefined,

        endDate: dateTo
            ? new Date(dateTo).toISOString()
            : undefined,
    },
    {
        enabled: canFetchRevenue,
    },
);

    const updateStatus = useUpdateRevenueStatusMutation();
    // Verify/Reject waits for confirmation in a dialog before calling the API
    const [pendingAction, setPendingAction] = useState<{
        record: RevenueRecord;
        status: "VERIFIED" | "REJECTED";
    } | null>(null);

    const handleConfirmAction = () => {
        if (!pendingAction) return;
        updateStatus.mutate(
            { id: pendingAction.record._id, payload: { status: pendingAction.status } },
            { onSettled: () => setPendingAction(null) }
        );
    };
    const records = data?.records ?? [];
    const [editingRecord, setEditingRecord] = useState<RevenueRecord | null>(null);

    // Mirrors the backend: the owner can edit only while PENDING; anyone with
    // revenue:manage can verify/reject and edit any entry.
    const { hasPermission } = usePermissions();
    const canEdit = (rec: RevenueRecord) =>
        (rec.employee?._id === currentUser?._id && rec.status === "PENDING") ||
        hasPermission(PERMISSIONS.REVENUE_MANAGE);

    const handleSelectLead = (lead: LeadItem) => {
        setSelectedLeadId(lead._id);
        setSearchQuery(`${lead.name}${lead.phone ? ` (${lead.phone})` : ""}`);
        setIsLeadDropdownOpen(false);
    };

    const totals = useMemo(() => {
        if (Array.isArray(data?.summary)) {
            const pending = data.summary.find((s) => s._id === "PENDING")?.totalAmount ?? 0;
            const verified = data.summary.find((s) => s._id === "VERIFIED")?.totalAmount ?? 0;
            const rejected = data.summary.find((s) => s._id === "REJECTED")?.totalAmount ?? 0;
            return { pending, verified, rejected, total: pending + verified + rejected };
        }
        return { pending: 0, verified: 0, rejected: 0, total: data?.summary?.totalAmount ?? 0 };
    }, [data]);

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
                        <span className="h-0.5 w-4 bg-primary rounded-full" />
                        <span>Sales Operations</span>
                    </div>
                    <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                        Revenue Log
                    </h1>
                    <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
                        {canManage
                            ? "Track, verify, and reject revenue entries across your organization."
                            : "Log deals and track your revenue submissions."}
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    <RefreshButton queryKey={["revenue-report"]} />

                    <Can permission="revenue:create">
                        <Link
                            to="/revenue/create"
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            <span>Log Revenue</span>
                        </Link>
                    </Can>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: totals.total, tone: "text-on-surface" },
                    { label: "Pending", value: totals.pending, tone: "text-amber-700" },
                    { label: "Verified", value: totals.verified, tone: "text-emerald-700" },
                    { label: "Rejected", value: totals.rejected, tone: "text-rose-700" },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
                        <p className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                            {card.label}
                        </p>
                        <p className={`font-headline-md text-xl font-extrabold mt-1 ${card.tone}`}>
                            ₹{card.value.toLocaleString("en-IN")}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30 shadow-sm">
                {/* View Mode Selector — Admin/Head only. Manager gets a
                    self-scoped 3-way control below instead (never a
                    cross-org picker); Employee gets no selector at all. */}
                {canManage && (
                    <select
                        value={viewMode}
                        onChange={(e) => {
                            setViewMode(e.target.value as RevenueViewMode);
                            setBranchId("");
                            setSelectedEmployeeId("");
                            setSelectedManagerId("");
                            setEmpSearchQuery("");
                        }}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none"
                    >
                        <option value="">All</option>
                        <option value="INDIVIDUAL">Individual Revenue</option>
                        <option value="TEAM">Team Revenue</option>
                        <option value="BRANCH">Branch Revenue</option>
                        <option value="LEAD">Lead Revenue</option>
                    </select>
                )}

                {/* 1. INDIVIDUAL: Searchable Employee Combobox (Admin/Head only) */}
                {viewMode === "INDIVIDUAL" && canManage && (
                    <div className="relative" ref={empDropdownRef}>
                        <input
                            type="text"
                            placeholder="Search Employee..."
                            value={empSearchQuery}
                            onFocus={() => setIsEmpDropdownOpen(true)}
                            onChange={(e) => {
                                setEmpSearchQuery(e.target.value);
                                setSelectedEmployeeId("");
                                setIsEmpDropdownOpen(true);
                            }}
                            className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none w-48"
                        />
                        {isEmpDropdownOpen && (
                            <div className="absolute left-0 z-30 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedEmployeeId("");
                                        setEmpSearchQuery("");
                                        setIsEmpDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-surface-container-low border-b border-outline-variant/10 font-bold text-on-surface-variant"
                                >
                                    All Employees
                                </button>
                                {filteredEmployees.map((emp: any) => (
                                    <button
                                        key={emp._id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedEmployeeId(emp._id);
                                            setEmpSearchQuery(emp.name);
                                            setIsEmpDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-surface-container-low transition-colors"
                                    >
                                        <div className="font-semibold text-on-surface">{emp.name}</div>
                                        <div className="text-[10px] text-on-surface-variant">{emp.email}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. TEAM: Select Manager Dropdown (Admin/Head only — a
                    Manager is always implicitly their own team, see the
                    Manager control below) */}
                {viewMode === "TEAM" && canManage && (
                    <select
                        value={selectedManagerId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none"
                    >
                        <option value="">Select Manager…</option>
                        {managers.map((m: any) => (
                            <option key={m._id} value={m._id}>
                                {m.name} ({m.role})
                            </option>
                        ))}
                    </select>
                )}

                {/* Manager: self-scoped 3-way control — whole team combined,
                    own individual revenue, or drill into one team member.
                    Never a picker for another manager's team. */}
                {isManager && (
                    <>
                        <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 w-fit">
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode("TEAM");
                                    setSelectedEmployeeId("");
                                    setEmpSearchQuery("");
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${effectiveViewMode === "TEAM" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                                    }`}
                            >
                                My Team
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode("INDIVIDUAL");
                                    setSelectedEmployeeId(currentUser?._id ?? "");
                                    setEmpSearchQuery("");
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${effectiveViewMode === "INDIVIDUAL" && selectedEmployeeId === currentUser?._id
                                    ? "bg-primary text-on-primary"
                                    : "text-on-surface-variant"
                                    }`}
                            >
                                My Revenue
                            </button>
                        </div>

                        <select
                            value={
                                effectiveViewMode === "INDIVIDUAL" && selectedEmployeeId !== currentUser?._id
                                    ? selectedEmployeeId
                                    : ""
                            }
                            onChange={(e) => {
                                const employeeId = e.target.value;
                                if (!employeeId) {
                                    setViewMode("TEAM");
                                    setSelectedEmployeeId("");
                                    return;
                                }
                                setViewMode("INDIVIDUAL");
                                setSelectedEmployeeId(employeeId);
                            }}
                            className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none"
                        >
                            <option value="">All Team Members</option>
                            {filteredEmployees.map((emp: any) => (
                                <option key={emp._id} value={emp._id}>
                                    {emp.name}
                                </option>
                            ))}
                        </select>
                    </>
                )}

                {/* 3. BRANCH: Select Branch Dropdown (Admin/Head only) */}
                {viewMode === "BRANCH" && canManage && (
                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none"
                    >
                        <option value="">Select branch…</option>
                        {branches?.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Lead Revenue: Admin/Head only */}
                {viewMode === "LEAD" && canManage && (
                    <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={isLoading ? "Loading leads..." : "Type lead name, phone, or email..."}
                                value={searchQuery}
                                onFocus={() => setIsLeadDropdownOpen(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedLeadId("");
                                    setIsLeadDropdownOpen(true);
                                }}
                                className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none w-52"
                            />
                        </div>

                        {/* Dropdown Results */}
                        {isLeadDropdownOpen && (
                            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg">
                                {isLeadLoading ? (
                                    <p className="p-3 text-xs text-on-surface-variant">Loading records...</p>
                                ) : filteredLeads.length === 0 ? (
                                    <p className="p-3 text-xs text-on-surface-variant">No matching leads found.</p>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <button
                                            key={lead._id}
                                            type="button"
                                            onClick={() => handleSelectLead(lead)}
                                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-b-0 ${selectedLeadId === lead._id ? "bg-primary/5 font-bold text-primary" : "text-on-surface"
                                                }`}
                                        >
                                            <div className="font-semibold">{lead.name}</div>
                                            <div className="text-[10px] text-on-surface-variant">
                                                {[lead.phone, lead.email].filter(Boolean).join(" • ")}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}


                {/* Common Filters */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as RevenueStatus | "")}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface outline-none"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs text-on-surface outline-none"
                />
                <span className="text-xs text-on-surface-variant">to</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs text-on-surface outline-none"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Client</th>
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Employee</th>
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Source</th>
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Amount</th>
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                                <th className="px-5 py-3.5 font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 text-xs">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 w-full rounded bg-surface-container-high animate-pulse" /></td></tr>
                                ))
                            ) : isError ? (
                                <tr><td colSpan={7} className="px-6 py-14 text-center text-error font-bold text-sm">Failed to load revenue records.</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-14 text-center text-on-surface-variant text-sm">No revenue entries found.</td></tr>
                            ) : (
                                records.map((rec) => (
                                    <tr key={rec._id} className="hover:bg-surface-container-low/40 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold text-on-surface">{rec.clientName}</p>
                                            {rec.reference && <p className="text-[10px] text-on-surface-variant/70">Ref: {rec.reference}</p>}
                                        </td>
                                        <td className="px-5 py-3.5">{rec.employee?.name ?? "—"}</td>
                                        <td className="px-5 py-3.5">{rec.source}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-on-surface">
                                            ₹{rec.amount.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-5 py-3.5 text-on-surface-variant">
                                            {new Date(rec.date).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-label-sm text-[10px] font-bold ${STATUS_BADGE[rec.status]}`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex justify-end gap-1.5">
                                            <Can permission="revenue:update">
                                                {canEdit(rec) && (
                                                    <button
                                                        onClick={() => setEditingRecord(rec)}
                                                        title={rec.lastEditedBy ? `Last edited by ${rec.lastEditedBy.name}` : "Edit entry"}
                                                        className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/20"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </Can>
                                            <Can permission="revenue:manage">
                                                {rec.status === "PENDING" && (
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setPendingAction({ record: rec, status: "VERIFIED" })}
                                                            disabled={updateStatus.isPending}
                                                            className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50"
                                                        >
                                                            Verify
                                                        </button>
                                                        <button
                                                            onClick={() => setPendingAction({ record: rec, status: "REJECTED" })}
                                                            disabled={updateStatus.isPending}
                                                            className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-500/20 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </Can>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditRevenueModal record={editingRecord} onClose={() => setEditingRecord(null)} />

            <ConfirmDialog
                open={pendingAction !== null}
                onClose={() => !updateStatus.isPending && setPendingAction(null)}
                onConfirm={handleConfirmAction}
                isLoading={updateStatus.isPending}
                tone={pendingAction?.status === "REJECTED" ? "danger" : "primary"}
                title={pendingAction?.status === "REJECTED" ? "Reject revenue entry?" : "Verify revenue entry?"}
                description={
                    pendingAction
                        ? `${pendingAction.status === "REJECTED" ? "Reject" : "Verify"} ₹${pendingAction.record.amount.toLocaleString("en-IN")} from ${pendingAction.record.clientName}, logged by ${pendingAction.record.employee?.name ?? "the employee"}? After this, the employee can no longer edit the entry.`
                        : undefined
                }
                confirmLabel={pendingAction?.status === "REJECTED" ? "Reject" : "Verify"}
            />
        </div>
    );
};

export default RevenuePage;