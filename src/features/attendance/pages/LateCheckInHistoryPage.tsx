import { useLateCheckInRequests } from "../api/lateCheckInApi";
import RefreshButton from "@/components/ui/RefreshButton";

export const LateCheckInHistoryPage = () => {
  const { data: requests = [], isLoading } = useLateCheckInRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mt-2">
            Late Check-in History
          </h1>
          <p className="text-sm text-on-surface-variant">
            View your submitted late access requests.
          </p>
        </div>

        <RefreshButton queryKey={["late-checkins"]} className="mt-2" />
      </div>

      <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">
            No history records found.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-high/50 border-b border-outline/10 text-xs font-medium text-on-surface-variant">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reviewed By</th>
                <th className="p-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {requests.map((item) => (
                <tr key={item._id}>
                  <td className="p-4 text-on-surface-variant">
                    {new Date(item.requestDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-on-surface">{item.reason}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.status === "pending"
                          ? "bg-amber-500/10 text-amber-600"
                          : item.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {item.reviewedBy?.name || "-"}
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {item.reviewRemarks || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
