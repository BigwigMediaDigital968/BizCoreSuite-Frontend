import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { RevenueRecord } from "@/types/revenue";
import { useUpdateRevenueMutation } from "../hooks/useRevenue";

interface EditRevenueModalProps {
  record: RevenueRecord | null;
  onClose: () => void;
}

const toForm = (record: RevenueRecord | null) => ({
  amount: record ? String(record.amount) : "",
  source: record?.source ?? "",
  clientName: record?.clientName ?? "",
  clientContact: record?.clientContact ?? "",
  reference: record?.reference ?? "",
  notes: record?.notes ?? "",
  date: record ? record.date.slice(0, 10) : "",
});

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary";
const labelClass =
  "block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider";

const EditRevenueModal = ({ record, onClose }: EditRevenueModalProps) => {
  const [form, setForm] = useState(() => toForm(record));
  const updateRevenue = useUpdateRevenueMutation();

  useEffect(() => {
    setForm(toForm(record));
  }, [record]);

  const isValid =
    Number(form.amount) > 0 && form.source.trim() !== "" && form.clientName.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !isValid) return;

    await updateRevenue.mutateAsync({
      id: record._id,
      payload: {
        amount: Number(form.amount),
        source: form.source.trim(),
        clientName: form.clientName.trim(),
        // Empty strings are sent on purpose so a cleared field is cleared server-side
        clientContact: form.clientContact.trim(),
        reference: form.reference.trim(),
        notes: form.notes.trim(),
        date: form.date ? new Date(form.date).toISOString() : undefined,
      },
    });
    onClose();
  };

  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title="Edit Revenue Entry"
      description={
        record?.status === "PENDING"
          ? "This entry is still pending approval."
          : `This entry is ${record?.status.toLowerCase()}. Changes are recorded against your name.`
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Amount (₹) *</label>
            <input
              type="number"
              min={0}
              required
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Source *</label>
            <input
              type="text"
              required
              value={form.source}
              onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Client Name *</label>
            <input
              type="text"
              required
              value={form.clientName}
              onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Client Contact</label>
            <input
              type="text"
              value={form.clientContact}
              onChange={(e) => setForm((p) => ({ ...p, clientContact: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Reference / Invoice #</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || updateRevenue.isPending}
            className="rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {updateRevenue.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditRevenueModal;
