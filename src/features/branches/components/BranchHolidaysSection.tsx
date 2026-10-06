import { useState, type FormEvent } from "react";
import {
    useBranchHolidaysQuery,
    useCreateHoliday,
    useUpdateHoliday,
    useDeleteHoliday,
} from "@/features/branches/hooks/useHolidays";
import { Can } from "@/components/Auth/Can";
import type { Holiday, HolidayType } from "@/types/holiday";
import { PERMISSIONS } from "@/types/auth";

interface BranchHolidaysSectionProps {
    branchId: string;
}

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
    { value: "company", label: "Company" },
    { value: "national", label: "National" },
    { value: "regional", label: "Regional" },
    { value: "optional", label: "Optional" },
];

export default function BranchHolidaysSection({
    branchId,
}: BranchHolidaysSectionProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState<HolidayType>("company");
    const [description, setDescription] = useState("");

    // React Query Hooks
    const { data: holidays = [], isLoading } = useBranchHolidaysQuery(
        branchId,
        selectedYear
    );
    const createHoliday = useCreateHoliday();
    const updateHoliday = useUpdateHoliday();
    const deleteHoliday = useDeleteHoliday();

    const isSaving = createHoliday.isPending || updateHoliday.isPending;

    const openCreateModal = () => {
        setEditingHoliday(null);
        setName("");
        setDate("");
        setType("company");
        setDescription("");
        setIsModalOpen(true);
    };

    const openEditModal = (holiday: Holiday) => {
        setEditingHoliday(holiday);
        setName(holiday.name);
        setDate(new Date(holiday.date).toISOString().split("T")[0]);
        setType(holiday.type);
        setDescription(holiday.description ?? "");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHoliday(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name || !date) return;

        const isoDate = new Date(date).toISOString();

        if (editingHoliday) {
            await updateHoliday.mutateAsync({
                id: editingHoliday._id,
                payload: {
                    name,
                    date: isoDate,
                    type,
                    description: description || undefined,
                },
            });
        } else {
            await createHoliday.mutateAsync({
                branchId,
                name,
                date: isoDate,
                type,
                description: description || undefined,
            });
        }

        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to deactivate/delete this holiday?")) {
            await deleteHoliday.mutateAsync(id);
        }
    };

    return (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            {/* Header Row — matching Attendance Rules section style */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">
                        calendar_today
                    </span>
                    <h2 className="font-headline-sm text-base font-bold text-on-surface">
                        Holidays
                    </h2>

                    {/* Inline Summary Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-xs font-semibold text-on-surface-variant">
                            {isLoading
                                ? "Loading..."
                                : `${holidays.length} ${holidays.length === 1 ? "Holiday" : "Holidays"
                                }`}
                        </span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-xs font-semibold text-on-surface-variant outline-none border-none cursor-pointer"
                        >
                            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-3">
                    <Can permission="holiday:create">
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex items-center gap-1 font-label-md text-xs font-bold text-primary hover:underline"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Holiday
                        </button>
                    </Can>
                    <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="flex items-center gap-1 font-label-md text-xs font-bold text-primary hover:underline"
                    >
                        <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
                        <span
                            className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? "rotate-180" : ""
                                }`}
                        >
                            expand_more
                        </span>
                    </button>
                </div>
            </div>

            {/* Expanded Table & Details */}
            {isExpanded && (
                <div className="pt-2">
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                                progress_activity
                            </span>
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-outline-variant/40 p-6 text-center">
                            <p className="font-body-sm text-xs text-on-surface-variant">
                                No holidays configured for {selectedYear}.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
                            <table className="w-full text-left text-sm text-on-surface">
                                <thead className="bg-surface-container-low border-b border-outline-variant/30 font-label-md text-xs font-bold text-on-surface-variant">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Date</th>
                                        <th scope="col" className="px-4 py-3">Holiday Name</th>
                                        <th scope="col" className="px-4 py-3">Type</th>
                                        <Can permission={[PERMISSIONS.HOLIDAY_UPDATE, PERMISSIONS.HOLIDAY_DELETE]}>
                                            <th scope="col" className="px-4 py-3">Status</th>
                                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                        </Can>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20">
                                    {holidays.map((h: any) => {
                                        const holidayDate = new Date(h.date);
                                        const formattedDate = holidayDate.toLocaleDateString(
                                            undefined,
                                            {
                                                weekday: "short",
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            }
                                        );

                                        return (
                                            <tr
                                                key={h._id}
                                                className="hover:bg-surface-container-low/50 transition-colors"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 font-body-sm text-xs font-semibold text-on-surface">
                                                    {formattedDate}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-label-md text-sm font-bold text-on-surface">
                                                        {h.name}
                                                    </div>
                                                    {h.description && (
                                                        <div className="font-body-sm text-xs text-on-surface-variant line-clamp-1">
                                                            {h.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span className="rounded-md bg-surface-container-high px-2 py-0.5 font-label-sm text-[10px] font-bold uppercase text-on-surface-variant">
                                                        {h.type}
                                                    </span>
                                                </td>
                                                <Can permission={[PERMISSIONS.HOLIDAY_UPDATE, PERMISSIONS.HOLIDAY_DELETE]}>

                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-[11px] font-bold ${h.isActive
                                                                    ? "bg-emerald-500/10 text-emerald-700"
                                                                    : "bg-surface-container-highest text-on-surface-variant/70"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${h.isActive
                                                                        ? "bg-emerald-600"
                                                                        : "bg-on-surface-variant/40"
                                                                    }`}
                                                            />
                                                            {h.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Can permission="holiday:update">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(h)}
                                                                    className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">
                                                                        edit
                                                                    </span>
                                                                </button>
                                                            </Can>
                                                            <Can permission="holiday:delete">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(h._id)}
                                                                    className="rounded-lg p-1.5 text-error/80 hover:bg-error/10 hover:text-error transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">
                                                                        delete
                                                                    </span>
                                                                </button>
                                                            </Can>
                                                        </div>
                                                    </td>
                                                </Can>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl space-y-4">
                        <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                            {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                                    Holiday Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Diwali"
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as HolidayType)}
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary"
                                >
                                    {HOLIDAY_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-label-md text-xs font-medium text-on-surface-variant">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional details"
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl px-4 py-2 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-xl bg-primary px-5 py-2 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isSaving
                                        ? "Saving..."
                                        : editingHoliday
                                            ? "Save Changes"
                                            : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}