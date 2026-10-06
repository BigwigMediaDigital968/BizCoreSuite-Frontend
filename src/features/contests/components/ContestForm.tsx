import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from "react";
import FormField from "@/components/ui/FormField";
import { useBranchesQuery } from "@/features/branches";
import { useCreateContest, useUpdateContest } from "../hooks/useContests";
import type { Contest } from "@/types/contest";

export interface ContestFormProps {
    /** Pass an existing contest object to enable Edit Mode */
    contest?: Contest | null;
    /** Optional callback executed after successfully creating or updating a contest */
    onSuccess?: () => void;
    /** Optional callback executed when clicking the Cancel button */
    onCancel?: () => void;
    /** Optional layout styling overrides */
    className?: string;
}

const toLocalInput = (iso?: string) => (iso ? iso.slice(0, 16) : "");

export const ContestForm = ({ contest, onSuccess, onCancel, className = "" }: ContestFormProps) => {
    const isEditMode = Boolean(contest);
    const { data: branches, isLoading: branchesLoading } = useBranchesQuery();
    const createContest = useCreateContest();
    const updateContest = useUpdateContest();
    const isSubmitting = createContest.isPending || updateContest.isPending;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync state with contest prop changes
    useEffect(() => {
        setTitle(contest?.title ?? "");
        setDescription(contest?.description ?? "");
        setStartDate(toLocalInput(contest?.startDate));
        setEndDate(toLocalInput(contest?.endDate));
        setSelectedBranches(
            new Set((contest?.branches ?? []).map((b) => (typeof b === "string" ? b : b._id)))
        );
        setMediaFile(null);
        setErrors({});
    }, [contest]);

    // Handle preview URL creation & cleanup for new file uploads
    const mediaPreviewUrl = useMemo(() => {
        if (!mediaFile) return null;
        return URL.createObjectURL(mediaFile);
    }, [mediaFile]);

    useEffect(() => {
        return () => {
            if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
        };
    }, [mediaPreviewUrl]);

    const toggleBranch = (branchId: string) => {
        setSelectedBranches((prev) => {
            const next = new Set(prev);
            if (next.has(branchId)) next.delete(branchId);
            else next.add(branchId);
            return next;
        });
    };

    const handleSelectAllBranches = () => {
        if (!branches) return;
        setSelectedBranches(new Set(branches.map((b) => b._id)));
    };

    const handleClearBranches = () => {
        setSelectedBranches(new Set());
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setMediaFile(file);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (title.trim().length < 3) next.title = "Title must be at least 3 characters";
        if (description.trim().length < 5)
            next.description = "Description must be at least 5 characters";
        if (selectedBranches.size === 0) next.branches = "Select at least one branch";
        if (!startDate) next.startDate = "Start date is required";
        if (!endDate) next.endDate = "End date is required";
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            next.endDate = "End date cannot be before start date";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            title: title.trim(),
            description: description.trim(),
            branches: Array.from(selectedBranches),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            media: mediaFile,
        };

        if (isEditMode && contest) {
            await updateContest.mutateAsync({ id: contest._id, payload });
        } else {
            await createContest.mutateAsync(payload);
        }

        onSuccess?.();
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
            {/* Contest Title */}
            <FormField
                id="contest-title"
                label="Contest Title"
                placeholder="e.g. Diwali Sales Sprint"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                required
            />

            {/* Description */}
            <div className="space-y-1.5">
                <label
                    htmlFor="contest-description"
                    className="block font-label-md text-xs font-semibold text-on-surface-variant"
                >
                    Description
                </label>
                <textarea
                    id="contest-description"
                    rows={3}
                    placeholder="Describe the contest goals, rules, or prizes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-on-surface-variant/40"
                    required
                />
                {errors.description && (
                    <p className="font-body-sm text-[11px] font-medium text-error">{errors.description}</p>
                )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label
                        htmlFor="contest-start"
                        className="block font-label-md text-xs font-semibold text-on-surface-variant"
                    >
                        Start Date & Time
                    </label>
                    <input
                        id="contest-start"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                    />
                    {errors.startDate && (
                        <p className="font-body-sm text-[11px] font-medium text-error">{errors.startDate}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <label
                        htmlFor="contest-end"
                        className="block font-label-md text-xs font-semibold text-on-surface-variant"
                    >
                        End Date & Time
                    </label>
                    <input
                        id="contest-end"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                    />
                    {errors.endDate && (
                        <p className="font-body-sm text-[11px] font-medium text-error">{errors.endDate}</p>
                    )}
                </div>
            </div>

            {/* Target Branches */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block font-label-md text-xs font-semibold text-on-surface-variant">
                        Target Branches ({selectedBranches.size} selected)
                    </label>
                    {branches && branches.length > 0 && (
                        <div className="flex items-center gap-2 text-[11px] font-medium">
                            <button
                                type="button"
                                onClick={handleSelectAllBranches}
                                className="text-primary hover:underline"
                            >
                                Select All
                            </button>
                            <span className="text-outline-variant">•</span>
                            <button
                                type="button"
                                onClick={handleClearBranches}
                                className="text-on-surface-variant/70 hover:underline"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {branchesLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 rounded-xl bg-surface-container-high animate-pulse" />
                        ))}
                    </div>
                ) : !branches || branches.length === 0 ? (
                    <p className="font-body-sm text-xs text-on-surface-variant/70 italic bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                        No branches available.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {branches.map((branch) => {
                            const isChecked = selectedBranches.has(branch._id);
                            return (
                                <label
                                    key={branch._id}
                                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all cursor-pointer select-none ${isChecked
                                            ? "border-primary/80 bg-primary/10 text-primary font-medium shadow-xs"
                                            : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleBranch(branch._id)}
                                        className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                                    />
                                    <span className="font-body-sm text-xs truncate">
                                        {branch.name}{" "}
                                        <span className="text-on-surface-variant/60 font-normal">({branch.code})</span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
                {errors.branches && (
                    <p className="font-body-sm text-[11px] font-medium text-error">{errors.branches}</p>
                )}
            </div>

            {/* Media Upload & Dynamic Preview */}
            <div className="space-y-2">
                <label
                    htmlFor="contest-media"
                    className="block font-label-md text-xs font-semibold text-on-surface-variant"
                >
                    Media Attachment (Image / Video / PDF)
                </label>

                {/* Upload Dropzone */}
                <div className="relative border-2 border-dashed border-outline-variant/40 hover:border-primary/50 bg-surface-container-low rounded-2xl p-4 transition-all group">
                    <input
                        id="contest-media"
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">cloud_upload</span>
                        </div>
                        <p className="text-xs font-semibold text-on-surface">
                            {mediaFile ? "Click or drag to replace attachment" : "Click or drag file to upload"}
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                            Supports JPG, PNG, MP4, WebM or PDF
                        </p>
                    </div>
                </div>

                {/* Media Preview Section */}
                {mediaFile && mediaPreviewUrl ? (
                    <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                        {mediaFile.type.startsWith("image/") ? (
                            /* Expanded Image Preview Layout */
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                                        New Image Selected
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setMediaFile(null)}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">close</span>
                                        Remove
                                    </button>
                                </div>

                                <div className="relative h-44 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                                    <img
                                        src={mediaPreviewUrl}
                                        alt="New file preview"
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-3 flex items-center justify-between">
                                        <p className="text-xs font-medium text-white truncate max-w-[70%]">
                                            {mediaFile.name}
                                        </p>
                                        <span className="text-[11px] text-slate-300">
                                            {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Minimal File Badge Layout (PDFs / Videos / Docs) */
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 shrink-0 flex items-center justify-center border border-slate-200">
                                    <span className="material-symbols-outlined text-xl">
                                        {mediaFile.type.startsWith("video/") ? "movie" : "description"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                                            New Attachment
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                                        {mediaFile.name}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMediaFile(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors"
                                    title="Remove attachment"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : contest?.media?.url ? (
                    <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                        {contest.media.resourceType?.startsWith("image") ||
                            contest.media.url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                            /* Existing Image Preview Layout */
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                        Current Media
                                    </span>
                                    <a
                                        href={contest.media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                        <span>Open full resolution</span>
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    </a>
                                </div>

                                <div className="relative h-44 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                                    <img
                                        src={contest.media.url}
                                        alt="Current contest media"
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Existing Non-Image File Layout */
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 shrink-0 flex items-center justify-center border border-slate-200">
                                    <span className="material-symbols-outlined text-xl">
                                        {contest.media.resourceType?.startsWith("video") ||
                                            contest.media.url.match(/\.(mp4|webm)$/i)
                                            ? "movie"
                                            : "description"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                        Current Media
                                    </span>
                                    <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                                        {contest.media.originalName ?? "Attached Document"}
                                    </p>
                                </div>
                                <a
                                    href={contest.media.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                                >
                                    <span>View File</span>
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </a>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl px-4 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                >
                    <span
                        className={`material-symbols-outlined text-base ${isSubmitting ? "animate-spin" : ""
                            }`}
                    >
                        {isSubmitting ? "sync" : isEditMode ? "save" : "military_tech"}
                    </span>
                    <span>{isSubmitting ? "Saving…" : isEditMode ? "Save Changes" : "Launch Contest"}</span>
                </button>
            </div>
        </form>
    );
};

export default ContestForm;