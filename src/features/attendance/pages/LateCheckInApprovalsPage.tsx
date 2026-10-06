import { useState } from "react";
import {
  useLateCheckInRequests,
  useReviewLateCheckIn,
} from "../api/lateCheckInApi";
import type { LateCheckInItem } from "../types/lateCheckIn";
import RefreshButton from "@/components/ui/RefreshButton";

export const LateCheckInApprovalsPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const { data: requests = [], isLoading } =
    useLateCheckInRequests(selectedStatus);
  const reviewMutation = useReviewLateCheckIn();

  const [activeRequest, setActiveRequest] = useState<LateCheckInItem | null>(
    null,
  );
  const [remarks, setRemarks] = useState("");

  const handleReview = (status: "approved" | "rejected") => {
    if (!activeRequest) return;
    reviewMutation.mutate(
      {
        requestId: activeRequest._id,
        status,
        remarks,
      },
      {
        onSuccess: () => {
          setActiveRequest(null);
          setRemarks("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-2">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mt-2">
            Late Check-in Approvals
          </h1>
          <p className="text-sm text-on-surface-variant">
            Review and manage employee after-hours access requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton queryKey={["late-checkins"]} />

          {/* Status Filter Tabs */}
          <div className="flex gap-2 rounded-xl bg-surface-container-high p-1">
            {["PENDING", "APPROVED", "REJECTED", ""].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedStatus === tab
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab || "ALL"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">
            No late check-in requests found.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-high/50 border-b border-outline/10 text-xs font-medium text-on-surface-variant">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {requests.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-surface-container-low/50"
                >
                  <td className="p-4">
                    <p className="font-semibold text-on-surface">
                      {item.employee?.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {item.employee?.email}
                    </p>
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {new Date(item.requestDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 max-w-xs truncate text-on-surface">
                    {item.reason}
                  </td>
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
                  <td className="p-4 text-right">
                    {item.status === "pending" && (
                      <button
                        onClick={() => setActiveRequest(item)}
                        className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Action Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-xl border border-outline/20">
            <h3 className="text-lg font-bold text-on-surface">
              Review Request: {activeRequest.employee?.name}
            </h3>
            <p className="text-sm bg-surface-container-high p-3 rounded-xl text-on-surface-variant">
              "{activeRequest.reason}"
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface">
                Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add notes for the employee..."
                className="w-full rounded-xl border border-outline/30 bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActiveRequest(null)}
                className="flex-1 rounded-xl border border-outline/30 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                disabled={reviewMutation.isPending}
                onClick={() => handleReview("rejected")}
                className="flex-1 rounded-xl bg-error-container text-on-error-container py-2.5 text-sm font-semibold hover:opacity-90"
              >
                Reject
              </button>
              <button
                disabled={reviewMutation.isPending}
                onClick={() => handleReview("approved")}
                className="flex-1 rounded-xl bg-primary text-on-primary py-2.5 text-sm font-semibold hover:bg-primary/90"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
