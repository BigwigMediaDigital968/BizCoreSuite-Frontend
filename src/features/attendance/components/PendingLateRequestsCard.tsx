import { useState } from "react";
import {
  useLateCheckInRequests,
  useReviewLateCheckIn,
} from "../api/lateCheckInApi";
import type { LateCheckInItem } from "../types/lateCheckIn";

export const PendingLateRequestsCard = () => {
  const { data: requests = [], isLoading } = useLateCheckInRequests("PENDING");
  const reviewMutation = useReviewLateCheckIn();
  const [selectedRequest, setSelectedRequest] =
    useState<LateCheckInItem | null>(null);
  const [remarks, setRemarks] = useState("");

  const handleAction = (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    reviewMutation.mutate(
      { requestId: selectedRequest._id, status, remarks },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setRemarks("");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-on-surface-variant">
        Loading pending approvals...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-on-surface text-base">
          Pending Late Access Requests
        </h3>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No pending requests to approve.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req._id}
              className="flex items-center justify-between rounded-xl border border-outline/10 bg-surface-container-low p-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {req.employee?.name}
                </p>
                <p className="text-xs text-on-surface-variant">{req.reason}</p>
                <p className="mt-1 text-[11px] text-on-surface-variant/70">
                  {new Date(req.requestDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(req)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary hover:bg-primary/90 transition-colors"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-xl border border-outline/20">
            <h4 className="text-base font-bold text-on-surface">
              Approve/Reject Request for {selectedRequest.employee?.name}
            </h4>
            <p className="text-sm bg-surface-container-high p-3 rounded-xl text-on-surface-variant">
              "{selectedRequest.reason}"
            </p>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason / Remarks (Optional)"
              className="w-full rounded-xl border border-outline/30 bg-surface-container-lowest p-3 text-sm outline-none focus:border-primary"
              rows={3}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl border border-outline/30 px-4 py-2 text-sm font-semibold text-on-surface"
              >
                Cancel
              </button>
              <button
                disabled={reviewMutation.isPending}
                onClick={() => handleAction("rejected")}
                className="rounded-xl bg-error-container text-on-error-container px-4 py-2 text-sm font-semibold"
              >
                Reject
              </button>
              <button
                disabled={reviewMutation.isPending}
                onClick={() => handleAction("approved")}
                className="rounded-xl bg-primary text-on-primary px-4 py-2 text-sm font-semibold"
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
