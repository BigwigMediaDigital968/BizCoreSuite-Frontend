// import { useMemo, useState, Fragment } from "react";
// import { useAuditLogs } from "../hooks/useAuditLogs";
// import { AUDIT_LOG_PAGE_SIZE } from "../constants";
// import ActionBadge from "../components/ActionBadge";
// import AuditLogFilters from "../components/AuditLogFilters";
// import RefreshButton from "@/components/ui/RefreshButton";
// import type { AuditLog, AuditLogQueryParams } from "@/types/audit";

// const formatDateTime = (iso: string) =>
//   new Date(iso).toLocaleString("en-IN", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   });

// const DEFAULT_FILTERS: AuditLogQueryParams = {
//   page: 1,
//   limit: AUDIT_LOG_PAGE_SIZE,
//   sortOrder: "desc",
// };

// interface AuditLogRowProps {
//   log: AuditLog;
//   expanded: boolean;
//   onToggle: () => void;
// }

// const AuditLogRow = ({ log, expanded, onToggle }: AuditLogRowProps) => (
//   <>
//     <tr
//       onClick={onToggle}
//       className={`group cursor-pointer transition-colors ${
//         expanded ? "bg-surface-container-low/80" : "hover:bg-surface-container-low/40"
//       }`}
//     >
//       {/* Timestamp */}
//       <td className="px-5 py-4 whitespace-nowrap text-on-surface-variant font-mono text-[11px]">
//         {formatDateTime(log.createdAt)}
//       </td>

//       {/* Actor */}
//       <td className="px-5 py-4">
//         <div className="flex items-center gap-2.5">
//           <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
//             {log.actor?.name ? log.actor.name[0].toUpperCase() : "S"}
//           </div>
//           <div className="truncate max-w-[160px] sm:max-w-none">
//             <div className="font-label-md text-xs font-bold text-on-surface truncate">
//               {log.actor?.name ?? "System / Deleted User"}
//             </div>
//             <div className="font-body-sm text-[11px] text-on-surface-variant/70 truncate">
//               {log.actor?.email ?? log.entityId}
//             </div>
//           </div>
//         </div>
//       </td>

//       {/* Action Badge */}
//       <td className="px-5 py-4">
//         <ActionBadge action={log.action} />
//       </td>

//       {/* Target Entity */}
//       <td className="px-5 py-4 font-medium text-on-surface">
//         <span className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-mono">
//           {log.entity}
//         </span>
//       </td>

//       {/* IP Address */}
//       <td className="px-5 py-4 font-mono text-[11px] text-on-surface-variant">
//         {log.ipAddress ? (
//           <span className="inline-flex items-center gap-1">
//             {log.ipAddress}
//           </span>
//         ) : (
//           "—"
//         )}
//       </td>

//       {/* Expand Icon */}
//       <td className="px-5 py-4 text-right">
//         <button
//           type="button"
//           className="rounded-lg p-1 text-on-surface-variant group-hover:text-on-surface hover:bg-surface-container transition-colors"
//         >
//           <span className="material-symbols-outlined text-lg align-middle">
//             {expanded ? "expand_less" : "expand_more"}
//           </span>
//         </button>
//       </td>
//     </tr>

//     {/* Expanded Drawer Details */}
//     {expanded && (
//       <tr className="bg-surface-container-low/40 border-b border-outline-variant/20">
//         <td colSpan={6} className="px-6 py-4">
//           <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-inner space-y-3">

//             <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
//               <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
//                 <span className="material-symbols-outlined text-sm">info</span>
//                 Event Execution Details
//               </span>
//               <span className="font-mono text-[11px] text-on-surface-variant/60">
//                 Log ID: {log._id}
//               </span>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Metadata JSON Viewer */}
//               <div className="space-y-1.5">
//                 <span className="block font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
//                   Context Metadata
//                 </span>
//                 <pre className="max-h-40 overflow-auto rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 font-mono text-[11px] text-on-surface leading-relaxed">
//                   {log.metadata && Object.keys(log.metadata).length > 0
//                     ? JSON.stringify(log.metadata, null, 2)
//                     : "// No extra payload metadata supplied"}
//                 </pre>
//               </div>

//               {/* Extended Parameters */}
//               <div className="space-y-2.5 font-body-sm text-xs">
//                 <span className="block font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
//                   Network & Entity References
//                 </span>

//                 <div className="space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
//                   <div className="flex items-center justify-between">
//                     <span className="text-on-surface-variant">Entity Target ID:</span>
//                     <span className="font-mono text-on-surface font-medium">{log.entityId ?? "—"}</span>
//                   </div>

//                   {log.branch && (
//                     <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
//                       <span className="text-on-surface-variant">Branch Scope:</span>
//                       <span className="font-bold text-on-surface">
//                         {log.branch.name} ({log.branch.code})
//                       </span>
//                     </div>
//                   )}

//                   <div className="flex flex-col gap-1 border-t border-outline-variant/20 pt-2">
//                     <span className="text-on-surface-variant">User Agent String:</span>
//                     <span className="font-mono text-[10px] text-on-surface-variant/80 break-all leading-tight bg-surface-container-lowest p-1.5 rounded border border-outline-variant/20">
//                       {log.userAgent ?? "—"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </td>
//       </tr>
//     )}
//   </>
// );

// const AuditLogPage = () => {
//   const [filters, setFilters] = useState<AuditLogQueryParams>(DEFAULT_FILTERS);
//   const [expandedId, setExpandedId] = useState<string | null>(null);

//   const queryParams = useMemo(() => filters, [filters]);
//   const { data, isLoading, isError, refetch } = useAuditLogs(queryParams);

//   const logs = data?.logs ?? [];

//   const pagination = data?.pagination ?? {
//     page: filters.page || 1,
//     limit: filters.limit || AUDIT_LOG_PAGE_SIZE,
//     total: 0,
//     totalPages: 1,
//   };

//   const { page, limit, total, totalPages } = pagination;
//   const start = total === 0 ? 0 : (page - 1) * limit + 1;
//   const end = Math.min(page * limit, total);

//   const handlePageChange = (newPage: number) => {
//     setFilters((f) => ({ ...f, page: newPage }));
//   };

//   const handleFilterChange = (newFilters: AuditLogQueryParams) => {
//     setFilters({ ...newFilters, page: 1 });
//   };

//   return (
//     <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

//       {/* Top Header */}

//       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div>
//           <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
//             <span className="h-0.5 w-4 bg-primary rounded-full" />
//             <span>Operations</span>
//           </div>
//           <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
//             Audit Trail
//           </h1>
//           <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
//             Comprehensive history of sensitive system actions, access, and data mutations.
//           </p>
//         </div>

//         <RefreshButton
//           queryKey={["audit-logs"]}
//           label="Refresh Logs"
//           className="self-start md:self-auto shrink-0"
//         />
//       </div>

//       {/* Main Content Container */}
//       <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden space-y-4">

//         {/* Filter Bar Component */}
//         <div className="p-4 bg-surface-container-low/30 border-b border-outline-variant/20">
//           <AuditLogFilters
//             filters={filters}
//             onChange={handleFilterChange}
//             onReset={() => setFilters(DEFAULT_FILTERS)}
//           />
//         </div>

//         {/* State Views: Loading / Error / Empty / Data Table */}
//         {isLoading ? (
//           <div className="flex flex-col items-center justify-center py-16 space-y-3">
//             <span className="material-symbols-outlined text-3xl text-primary animate-spin">
//               sync
//             </span>
//             <p className="font-body-md text-sm text-on-surface-variant font-medium">
//               Fetching audit logs...
//             </p>
//           </div>
//         ) : isError ? (
//           <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center px-4">
//             <div className="h-12 w-12 rounded-full bg-error/10 text-error flex items-center justify-center">
//               <span className="material-symbols-outlined text-2xl">error</span>
//             </div>
//             <p className="font-headline-sm text-base font-bold text-on-surface">
//               Failed to load audit logs
//             </p>
//             <p className="font-body-sm text-xs text-on-surface-variant max-w-md">
//               There was a problem communicating with the server. Please check your connection and try again.
//             </p>
//             <button
//               onClick={() => refetch()}
//               className="mt-2 text-xs font-bold text-primary hover:underline"
//             >
//               Retry Request
//             </button>
//           </div>
//         ) : logs.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center px-4">
//             <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
//               manage_search
//             </span>
//             <p className="font-headline-sm text-base font-bold text-on-surface">
//               No matching records found
//             </p>
//             <p className="font-body-sm text-xs text-on-surface-variant/70">
//               Try adjusting or resetting your filter criteria.
//             </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="border-b border-outline-variant/20 bg-surface-container-low/60 font-label-md text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
//                   <th className="px-5 py-3.5">Timestamp</th>
//                   <th className="px-5 py-3.5">Actor</th>
//                   <th className="px-5 py-3.5">Action Type</th>
//                   <th className="px-5 py-3.5">Entity Target</th>
//                   <th className="px-5 py-3.5">IP Address</th>
//                   <th className="px-5 py-3.5 text-right">Details</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
//                 {logs.map((log) => (
//                   <Fragment key={log._id}>
//                     <AuditLogRow
//                       log={log}
//                       expanded={expandedId === log._id}
//                       onToggle={() =>
//                         setExpandedId((current) =>
//                           current === log._id ? null : log._id
//                         )
//                       }
//                     />
//                   </Fragment>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Footer Pagination Bar */}
//         {total > 0 && (
//           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-outline-variant/20 bg-surface-container-low/20">
//             <span className="font-body-sm text-xs text-on-surface-variant">
//               Showing <strong className="text-on-surface">{start}</strong>–
//               <strong className="text-on-surface">{end}</strong> of{" "}
//               <strong className="text-on-surface">{total}</strong> entries
//             </span>

//             <div className="flex items-center gap-2">
//               <button
//                 className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                 disabled={page <= 1}
//                 onClick={() => handlePageChange(page - 1)}
//                 title="Previous Page"
//               >
//                 <span className="material-symbols-outlined text-base">
//                   chevron_left
//                 </span>
//               </button>

//               <span className="font-label-md text-xs font-bold text-on-surface px-2">
//                 Page {page} of {totalPages || 1}
//               </span>

//               <button
//                 className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                 disabled={page >= totalPages}
//                 onClick={() => handlePageChange(page + 1)}
//                 title="Next Page"
//               >
//                 <span className="material-symbols-outlined text-base">
//                   chevron_right
//                 </span>
//               </button>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default AuditLogPage;

import { useMemo, useState, Fragment } from "react";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { AUDIT_LOG_PAGE_SIZE } from "../constants";
import ActionBadge from "../components/ActionBadge";
import AuditLogFilters from "../components/AuditLogFilters";
import RefreshButton from "@/components/ui/RefreshButton";
import type { ActivityLog, ActivityLogQueryParams } from "@/types/activityLog";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const DEFAULT_FILTERS: ActivityLogQueryParams = {
  page: 1,
  limit: AUDIT_LOG_PAGE_SIZE,
};

interface AuditLogRowProps {
  log: ActivityLog;
  expanded: boolean;
  onToggle: () => void;
}

const AuditLogRow = ({ log, expanded, onToggle }: AuditLogRowProps) => (
  <>
    <tr
      onClick={onToggle}
      className={`group cursor-pointer transition-colors ${
        expanded
          ? "bg-surface-container-low/80"
          : "hover:bg-surface-container-low/40"
      }`}
    >
      {/* Timestamp */}
      <td className="px-5 py-4 whitespace-nowrap text-on-surface-variant font-mono text-[11px]">
        {formatDateTime(log.createdAt)}
      </td>

      {/* Actor */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
            {log.performedBy?.name
              ? log.performedBy.name[0].toUpperCase()
              : "S"}
          </div>
          <div className="truncate max-w-[160px] sm:max-w-none">
            <div className="font-label-md text-xs font-bold text-on-surface truncate">
              {log.performedBy?.name ?? "System / Deleted User"}
            </div>
            <div className="font-body-sm text-[11px] text-on-surface-variant/70 truncate">
              {log.performedBy?.email ?? (log.entityId || "—")}
            </div>
          </div>
        </div>
      </td>

      {/* Action Badge & Description */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <ActionBadge action={log.action} />
          <span className="text-[11px] text-on-surface-variant line-clamp-1">
            {log.description}
          </span>
        </div>
      </td>

      {/* Module / Target Entity */}
      <td className="px-5 py-4 font-medium text-on-surface">
        <span className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-mono font-semibold">
          {log.module}
        </span>
      </td>

      {/* IP Address */}
      <td className="px-5 py-4 font-mono text-[11px] text-on-surface-variant">
        {log.ipAddress ? (
          <span className="inline-flex items-center gap-1">
            {log.ipAddress}
          </span>
        ) : (
          "—"
        )}
      </td>

      {/* Expand Icon */}
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          className="rounded-lg p-1 text-on-surface-variant group-hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-lg align-middle">
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </button>
      </td>
    </tr>

    {/* Expanded Drawer Details */}
    {expanded && (
      <tr className="bg-surface-container-low/40 border-b border-outline-variant/20">
        <td colSpan={6} className="px-6 py-4">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-inner space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                Event Execution Details
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant/60">
                Log ID: {log._id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metadata JSON Viewer */}
              <div className="space-y-1.5">
                <span className="block font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Context Metadata
                </span>
                <pre className="max-h-40 overflow-auto rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 font-mono text-[11px] text-on-surface leading-relaxed">
                  {log.metadata && Object.keys(log.metadata).length > 0
                    ? JSON.stringify(log.metadata, null, 2)
                    : "// No extra payload metadata supplied"}
                </pre>
              </div>

              {/* Extended Parameters */}
              <div className="space-y-2.5 font-body-sm text-xs">
                <span className="block font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Network & Entity References
                </span>

                <div className="space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">
                      Entity Target ID:
                    </span>
                    <span className="font-mono text-on-surface font-medium">
                      {log.entityId ?? "—"}
                    </span>
                  </div>

                  {log.branch && (
                    <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
                      <span className="text-on-surface-variant">
                        Branch Scope:
                      </span>
                      <span className="font-bold text-on-surface">
                        {log.branch.name}{" "}
                        {log.branch.code ? `(${log.branch.code})` : ""}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 border-t border-outline-variant/20 pt-2">
                    <span className="text-on-surface-variant">
                      Description:
                    </span>
                    <span className="font-mono text-[11px] text-on-surface break-words bg-surface-container-lowest p-2 rounded border border-outline-variant/20">
                      {log.description}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )}
  </>
);

const AuditLogPage = () => {
  const [filters, setFilters] =
    useState<ActivityLogQueryParams>(DEFAULT_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryParams = useMemo(() => filters, [filters]);
  const { data, isLoading, isError, refetch } = useAuditLogs(queryParams);

  const logs = data?.logs ?? [];

  const pagination = data?.pagination ?? {
    page: filters.page || 1,
    limit: filters.limit || AUDIT_LOG_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  const { page, limit, total, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const handlePageChange = (newPage: number) => {
    setFilters((f: any) => ({ ...f, page: newPage }));
  };

  const handleFilterChange = (newFilters: ActivityLogQueryParams) => {
    setFilters({ ...newFilters, page: 1 });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
            <span className="h-0.5 w-4 bg-primary rounded-full" />
            <span>Operations</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            Audit Trail
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Comprehensive history of sensitive system actions, access, and data
            mutations.
          </p>
        </div>

        <RefreshButton
          queryKey={["audit-logs"]}
          label="Refresh Logs"
          className="self-start md:self-auto shrink-0"
        />
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden space-y-4">
        <div className="p-4 bg-surface-container-low/30 border-b border-outline-variant/20">
          <AuditLogFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">
              sync
            </span>
            <p className="font-body-md text-sm text-on-surface-variant font-medium">
              Fetching activity logs...
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-error/10 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <p className="font-headline-sm text-base font-bold text-on-surface">
              Failed to load activity logs
            </p>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-md">
              There was a problem communicating with the server. Please check
              your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              Retry Request
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
              manage_search
            </span>
            <p className="font-headline-sm text-base font-bold text-on-surface">
              No matching records found
            </p>
            <p className="font-body-sm text-xs text-on-surface-variant/70">
              Try adjusting or resetting your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/60 font-label-md text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Module</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-xs text-on-surface">
                {logs.map((log: ActivityLog) => (
                  <Fragment key={log._id}>
                    <AuditLogRow
                      log={log}
                      expanded={expandedId === log._id}
                      onToggle={() =>
                        setExpandedId((current) =>
                          current === log._id ? null : log._id,
                        )
                      }
                    />
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-outline-variant/20 bg-surface-container-low/20">
            <span className="font-body-sm text-xs text-on-surface-variant">
              Showing <strong className="text-on-surface">{start}</strong>–
              <strong className="text-on-surface">{end}</strong> of{" "}
              <strong className="text-on-surface">{total}</strong> entries
            </span>

            <div className="flex items-center gap-2">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                title="Previous Page"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
              </button>

              <span className="font-label-md text-xs font-bold text-on-surface px-2">
                Page {page} of {totalPages || 1}
              </span>

              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                title="Next Page"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
