import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCreateRevenueMutation } from "../hooks/useRevenue";
import { useLeads } from "@/features/leads";

interface LeadItem {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
}

const EMPTY_FORM = {
  amount: "",
  source: "",
  clientName: "",
  clientContact: "",
  reference: "",
  notes: "",
  date: new Date().toISOString().slice(0, 10),
};

export const CreateRevenuePage = () => {
  const navigate = useNavigate();
  const [entryType, setEntryType] = useState<"LEAD" | "CUSTOM">("LEAD");
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedLeadId, setSelectedLeadId] = useState("");

  // Searchable dropdown state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createRevenue = useCreateRevenueMutation();
  const { data, isLoading } = useLeads();
  const leads: LeadItem[] = data?.leads ?? [];

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLead = (lead: LeadItem) => {
    setSelectedLeadId(lead._id);
    setSearchQuery(`${lead.name}${lead.phone ? ` (${lead.phone})` : ""}`);
    setIsDropdownOpen(false);

    setForm((p) => ({
      ...p,
      clientName: lead.name || "",
      clientContact: lead.phone || lead.email || "",
      source: lead.source || p.source,
    }));
  };

  const handleTypeChange = (type: "LEAD" | "CUSTOM") => {
    setEntryType(type);
    setSelectedLeadId("");
    setSearchQuery("");
    if (type === "LEAD") {
      setForm((p) => ({ ...p, clientName: "", clientContact: "" }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.source.trim() || !form.clientName.trim()) return;

    await createRevenue.mutateAsync({
      amount: Number(form.amount),
      source: form.source.trim(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim() || undefined,
      reference: form.reference.trim() || undefined,
      notes: form.notes.trim() || undefined,
      date: form.date ? new Date(form.date).toISOString() : undefined,
    });

    navigate("/revenue");
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-on-surface mb-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Revenue Log
          </button>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Log New Revenue
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="max-w-6xl rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-6 shadow-sm"
      >
        {/* Entry Mode Selector Switch */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Revenue Source Type
          </label>
          <div className="inline-flex rounded-xl bg-surface-container-low p-1 border border-outline-variant/30">
            <button
              type="button"
              onClick={() => handleTypeChange("LEAD")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                entryType === "LEAD"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">person_search</span>
              Existing Lead
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("CUSTOM")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                entryType === "CUSTOM"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Direct / Custom Client
            </button>
          </div>
        </div>

        {/* Searchable Lead Select Box */}
        {entryType === "LEAD" && (
          <div className="relative space-y-1.5" ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Search & Select Lead *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isLoading ? "Loading leads..." : "Type lead name, phone, or email..."}
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedLeadId("");
                  setIsDropdownOpen(true);
                }}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pl-10 text-xs text-on-surface outline-none focus:border-primary"
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-on-surface-variant/70">
                search
              </span>
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg">
                {isLoading ? (
                  <p className="p-3 text-xs text-on-surface-variant">Loading records...</p>
                ) : filteredLeads.length === 0 ? (
                  <p className="p-3 text-xs text-on-surface-variant">No matching leads found.</p>
                ) : (
                  filteredLeads.map((lead) => (
                    <button
                      key={lead._id}
                      type="button"
                      onClick={() => handleSelectLead(lead)}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-b-0 ${
                        selectedLeadId === lead._id ? "bg-primary/5 font-bold text-primary" : "text-on-surface"
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

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Amount (₹) *
            </label>
            <input
              type="number"
              min={0}
              required
              placeholder="e.g. 50000"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Source *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Direct Sale, Website"
              value={form.source}
              onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Client Name *
            </label>
            <input
              type="text"
              required
            //   readOnly={entryType === "LEAD" && Boolean(selectedLeadId)}
              placeholder="Client or Company Name"
              value={form.clientName}
              onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary read-only:opacity-75"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Client Contact
            </label>
            <input
              type="text"
            //   readOnly={entryType === "LEAD" && Boolean(selectedLeadId)}
              placeholder="Phone or Email"
              value={form.clientContact}
              onChange={(e) => setForm((p) => ({ ...p, clientContact: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary read-only:opacity-75"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Reference / Invoice #
            </label>
            <input
              type="text"
              placeholder="e.g. INV-2026-001"
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
            Notes (Optional)
          </label>
          <textarea
            rows={4}
            placeholder="Add relevant notes about this transaction..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl px-5 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!form.amount || !form.source.trim() || !form.clientName.trim() || createRevenue.isPending}
            className="rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {createRevenue.isPending ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
};