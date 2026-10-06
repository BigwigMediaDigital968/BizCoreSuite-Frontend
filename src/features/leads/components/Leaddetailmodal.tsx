import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import Modal from "@/components/ui/Modal";
import { Can } from "@/components/Auth/Can";
import type { LeadStatus } from "@/types/lead";
import { useLead, useUpdateLeadStatus, useAddLeadRemark } from "../hooks/useLeads";
import AssignLeadModal from "./AssignLeadModal";

interface LeadDetailModalProps {
  leadId: string | null;
  onClose: () => void;
}

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

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow Up Scheduled" },
  { value: "interested", label: "Interested" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const InfoField = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
  <div>
    <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant/60 block">{label}</span>
    <span className={`font-body-sm text-xs truncate block ${highlight ? "font-bold text-primary" : "font-semibold text-on-surface"}`}>
      {value}
    </span>
  </div>
);

const LeadDetailModal = ({ leadId, onClose }: LeadDetailModalProps) => {
  const open = Boolean(leadId);
  const navigate = useNavigate();

  const { data: lead, isLoading } = useLead(leadId ?? undefined);
  const updateStatus = useUpdateLeadStatus();
  const addRemark = useAddLeadRemark();

  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">("");
  const [remarkText, setRemarkText] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);

  const creatorName = useMemo(() => {
    if (!lead?.createdBy) return "System / Self-registered";
    return typeof lead.createdBy === "object" ? lead.createdBy.name : "System";
  }, [lead]);

  const currentBranch = useMemo(
    () => (lead?.branch && typeof lead.branch === "object" ? lead.branch : null),
    [lead]
  );

  const currentAssignee = useMemo(
    () => (lead?.assignedTo && typeof lead.assignedTo === "object" ? lead.assignedTo : null),
    [lead]
  );

  const hasChanges = Boolean(selectedStatus) || Boolean(remarkText.trim());

  const handleQuickSave = async () => {
    if (!leadId) return;
    if (selectedStatus) {
      await updateStatus.mutateAsync({ id: leadId, payload: { status: selectedStatus } });
    }
    if (remarkText.trim()) {
      await addRemark.mutateAsync({ id: leadId, payload: { remark: remarkText.trim() } });
    }
    setSelectedStatus("");
    setRemarkText("");
    onClose();
  };

  const handleNavigateToWorkspace = () => {
    if (!leadId) return;
    onClose();
    navigate(`/leads/${leadId}`);
  };

  return (
    <>
      <Modal title="Lead Details" open={open} onClose={onClose} size="md">
        {isLoading || !lead ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
            <p className="font-label-sm text-xs text-on-surface-variant font-medium">Loading CRM snapshot...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-outline-variant/20 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">{lead.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_BADGE_CLASSES[lead.status]}`}
                  >
                    {lead.status.replace("_", " ")}
                  </span>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant/80 mt-0.5">
                  {lead.phoneCountryCode} {lead.phone} {lead.email ? `• ${lead.email}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {lead.phone && (
                  <Link
                    to={`/dialer?leadId=${lead._id}`}
                    className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2 text-on-surface hover:bg-surface-container-low transition-colors"
                    title="Call Lead"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-600 block">call</span>
                  </Link>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2 text-on-surface hover:bg-surface-container-low transition-colors"
                    title="Email Lead"
                  >
                    <span className="material-symbols-outlined text-base text-sky-600 block">mail</span>
                  </a>
                )}
              </div>
            </div>

            {/* Ownership summary */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5 text-xs">
              <InfoField label="Created By" value={creatorName} />
              <InfoField label="Branch" value={currentBranch ? currentBranch.name : "Unassigned"} />
              <InfoField
                label="Representative"
                value={currentAssignee ? currentAssignee.name : "Unassigned"}
                highlight
              />
            </div>

            <Can permission="lead:assign">
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                {currentAssignee ? "Reassign Lead" : "Assign Lead"}
              </button>
            </Can>

            {/* Update section */}
            <div className="rounded-xl border border-outline-variant/30 p-3.5 space-y-3">
              <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant/70">
                Update Lead
              </span>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
              >
                <option value="">Change status (current: {lead.status})</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Add a remark or activity note..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleNavigateToWorkspace}
                className="inline-flex items-center gap-1 font-label-sm text-xs font-bold text-primary hover:underline"
              >
                Open Full Workspace
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-outline-variant/40 px-3.5 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickSave}
                  disabled={!hasChanges}
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {lead && (
        <AssignLeadModal
          open={showAssignModal}
          leadId={lead._id}
          leadName={lead.name}
          currentBranchId={currentBranch?._id}
          currentEmployeeId={currentAssignee?._id}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </>
  );
};

export default LeadDetailModal;