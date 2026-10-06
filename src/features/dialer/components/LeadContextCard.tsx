// src/features/dialer/components/LeadContextCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useLead, useLeads } from "@/features/leads/hooks/useLeads";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCallStore } from "@/store/call.store";
import type { Lead } from "@/types/lead";

interface LeadContextCardProps {
  phoneNumber: string;
  onSelectLeadPhone?: (phone: string) => void;
}

export const LeadContextCard: React.FC<LeadContextCardProps> = ({
  phoneNumber,
  onSelectLeadPhone,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramLeadId = searchParams.get("leadId") || "";

  const activeLead = useCallStore((s) => s.activeLead);
  const setActiveLead = useCallStore((s) => s.setActiveLead);

  // Fetch lead if leadId is in URL parameters
  const { data: directLead, isLoading: isDirectLeadLoading } = useLead(
    paramLeadId || undefined
  );

  // Sync loaded direct lead with call store
  useEffect(() => {
    if (directLead) {
      setActiveLead(directLead);
    }
  }, [directLead, setActiveLead]);

  // Searchable lead picker
  const [searchQuery, setSearchQuery] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const { data: searchData, isLoading: isSearchLoading } = useLeads({
    page: 1,
    limit: 8,
    search: debouncedSearch.length >= 1 ? debouncedSearch : undefined,
  });

  useEffect(() => {
    if (!isPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPickerOpen]);

  const handlePickLead = (lead: Lead) => {
    // Save to global call store
    setActiveLead(lead);

    // Sync to URL parameters
    const next = new URLSearchParams(searchParams);
    next.set("leadId", lead._id);
    if (next.get("phone")) next.delete("phone");
    setSearchParams(next, { replace: true });

    setSearchQuery("");
    setIsPickerOpen(false);

    if (onSelectLeadPhone && lead.phone) {
      onSelectLeadPhone(lead.phone);
    }
  };

  const handleClearSelectedLead = () => {
    setActiveLead(null);
    const next = new URLSearchParams(searchParams);
    next.delete("leadId");
    next.delete("phone");
    setSearchParams(next, { replace: true });
    setSearchQuery("");
    setIsPickerOpen(false);
  };

  // Combine direct fetched lead or stored lead
  const matchedLead: Lead | null = directLead || activeLead;
  const isFetching = paramLeadId ? isDirectLeadLoading : isSearchLoading;

  const pickerResults = useMemo(
    () => searchData?.leads ?? [],
    [searchData]
  );

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="space-y-3 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              person_search
            </span>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              CRM Lead Intelligence
            </h3>
          </div>
          {isFetching && (
            <span className="text-[10px] font-semibold text-primary animate-pulse">
              {paramLeadId ? "Fetching Lead Data..." : "Searching..."}
            </span>
          )}
        </div>

        {/* Search input when no lead is active */}
        {!matchedLead && (
          <div ref={pickerRef} className="relative">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Search a lead by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsPickerOpen(true);
                }}
                onFocus={() => setIsPickerOpen(true)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low pl-9 pr-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition-all"
              />
              {phoneNumber && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                  Dialed: {phoneNumber}
                </span>
              )}
            </div>

            {isPickerOpen && (
              <div className="absolute z-30 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg divide-y divide-outline-variant/20">
                {isSearchLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <span className="material-symbols-outlined animate-spin text-lg text-primary">
                      progress_activity
                    </span>
                  </div>
                ) : pickerResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-1">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">
                      contact_search
                    </span>
                    <p className="text-[11px] font-semibold text-on-surface-variant">
                      {debouncedSearch
                        ? `No lead matches "${debouncedSearch}"`
                        : "Start typing to search leads"}
                    </p>
                  </div>
                ) : (
                  pickerResults.map((l: Lead) => (
                    <button
                      key={l._id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickLead(l)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-surface-container-low transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-on-surface">
                          {l.name}
                        </span>
                        <span className="block truncate text-[10px] text-on-surface-variant/70">
                          {l.phoneCountryCode || "+91"} {l.phone}
                          {l.email ? ` · ${l.email}` : ""}
                        </span>
                      </span>
                      <span className="ml-2 inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary">
                        <span className="material-symbols-outlined text-base">
                          arrow_forward
                        </span>
                        Link
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Lead Display Card */}
      {matchedLead ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 relative">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-headline-sm text-lg font-extrabold text-on-surface">
                  {matchedLead.name}
                </h4>
                <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Direct Linked
                </span>
              </div>

              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">call</span>
                {matchedLead.phoneCountryCode || "+91"} {matchedLead.phone}
              </p>

              {matchedLead.email && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  {matchedLead.email}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-primary/10 text-primary border border-primary/20">
                {matchedLead.status
                  ? matchedLead.status.replace("_", " ")
                  : "Lead"}
              </span>

              {onSelectLeadPhone && (
                <button
                  type="button"
                  onClick={() =>
                    matchedLead.phone && onSelectLeadPhone(matchedLead.phone)
                  }
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-xs">
                    dialpad
                  </span>
                  Load Number
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Source
              </p>
              <p className="text-xs font-bold text-on-surface mt-0.5">
                {matchedLead.source || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                City
              </p>
              <p className="text-xs font-bold text-on-surface mt-0.5">
                {matchedLead.city || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Industry
              </p>
              <p className="text-xs font-bold text-on-surface mt-0.5">
                {matchedLead.industry || "N/A"}
              </p>
            </div>
          </div>

          {matchedLead.remarks && (
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 space-y-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Latest Remarks
              </p>
              <p className="text-xs text-on-surface line-clamp-2">
                {matchedLead.remarks}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleClearSelectedLead}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            Clear linked lead selection
          </button>
        </div>
      ) : paramLeadId && isDirectLeadLoading ? (
        <div className="flex items-center justify-center py-10">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">
            progress_activity
          </span>
        </div>
      ) : null}
    </div>
  );
};