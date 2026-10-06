// src/features/dialer/components/ActiveCallPopup.tsx
import { useNavigate, useLocation } from "react-router";
import { useCallStore } from "@/store/call.store";
import { PhoneCall } from "lucide-react";

export const ActiveCallPopup = () => {
  const { callState, toNumber, durationSec, callRef, setCallState, activeLead } =
    useCallStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isCallActive =
    callState === "calling" || callState === "ringing" || callState === "active";
  const isOnDialerPage = location.pathname.startsWith("/dialer");

  // Hide popup if no call is active OR user is already on the dialer page
  if (!isCallActive || isOnDialerPage) return null;

  const handleHangup = () => {
    if (callRef) {
      callRef.hangup((res: any) =>
        console.log("[Global Popup] Hangup res:", res)
      );
    }
    setCallState("ended");
  };

  const handleReturnToDialer = () => {
    // Retain linked lead ID in URL parameters if available
    if (activeLead?._id) {
      navigate(`/dialer?leadId=${activeLead._id}`);
    } else {
      navigate("/dialer");
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Helper for lead avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const statusColor =
    callState === "active"
      ? "bg-emerald-500"
      : callState === "ringing"
      ? "bg-amber-500 animate-pulse"
      : "bg-primary animate-ping";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-surface-container-high/95 text-on-surface px-4 py-3 rounded-2xl shadow-2xl border border-outline-variant/30 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3">
        {/* Lead Avatar or Default Call Icon */}
        <div className="relative flex-shrink-0">
          {activeLead?.name ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs">
              {getInitials(activeLead.name)}
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PhoneCall className="text-xl" />
            </div>
          )}

          {/* Pulse Status Badge */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface-container-high">
            <span
              className={`h-2.5 w-2.5 rounded-full ${statusColor}`}
            />
          </span>
        </div>

        {/* Lead & Call Details */}
        <div className="min-w-0 max-w-[180px]">
          <h4 className="text-xs font-bold text-on-surface truncate">
            {activeLead?.name || toNumber || "Unknown Caller"}
          </h4>

          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium mt-0.5">
            <span className="capitalize text-primary font-semibold">
              {callState}
            </span>
            <span>•</span>
            <span className="font-mono">{formatDuration(durationSec)}</span>
          </div>

          {activeLead?.name && (
            <p className="text-[10px] text-on-surface-variant/70 font-mono truncate">
              {toNumber}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pl-3 border-l border-outline-variant/20">
        <button
          type="button"
          onClick={handleReturnToDialer}
          title="Return to Dialer view"
          className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">
            open_in_full
          </span>
          <span className="hidden sm:inline">Dialer</span>
        </button>

        <button
          type="button"
          onClick={handleHangup}
          title="Hang Up Call"
          className="flex items-center gap-1 px-3 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/30 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">call_end</span>
          <span className="hidden sm:inline">Hang Up</span>
        </button>
      </div>
    </div>
  );
};