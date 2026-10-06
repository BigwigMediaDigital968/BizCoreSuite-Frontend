// // src/features/dialer/components/Dialer.tsx
// import { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router";
// import { useQuery } from "@tanstack/react-query";
// import { useStringeeClient } from "../hooks/useStringeeClient";
// import { useDialer } from "../hooks/useDialer";
// import { useAuthStore } from "@/store/auth.store";
// import { useLead } from "@/features/leads/hooks/useLeads";
// import { KeypadConsole } from "./KeypadConsole";
// import { LeadContextCard } from "./LeadContextCard";
// import { RecentCallLogsTable } from "./RecentCallLogsTable";
// import { stringeeNumberApi } from "@/services/stringeeNumberApi";
// import { DialerAccessModal } from "./DialerAccessModal";
// import { ROLES } from "@/types/auth";

// export const Dialer = () => {
//   const user = useAuthStore((s) => s.user);
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const paramLeadId = searchParams.get("leadId") || searchParams.get("phone");

//   const isElevatedRole =
//     user?.role === ROLES.HEAD ||
//     user?.role === ROLES.ADMIN ||
//     user?.role === ROLES.MANAGER;

//   // Generate today's cache key for the employee session
//   // const todayStr = new Date().toISOString().split("T")[0];
//   // const storageKey = `dialer_auth_verified_${user?._id}_${todayStr}`;

//   const storageKey = `dialer_auth_verified_${user?._id}`;

//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
//     if (isElevatedRole) return true;
//     return sessionStorage.getItem(storageKey) === "true";
//   });

//   const {
//     data: assignment,
//     isLoading: isLoadingAssignment,
//     isError,
//   } = useQuery({
//     queryKey: ["my-stringee-assignment"],
//     queryFn: stringeeNumberApi.getMyAssignment,
//     enabled: !isElevatedRole && !!user,
//     retry: false,
//   });

//   const [authError, setAuthError] = useState<string | null>(null);

//   const { clientRef, status, error, connect } = useStringeeClient();
//   const {
//     callState,
//     durationSec,
//     toNumber,
//     makeCall,
//     hangup,
//     reset,
//     changeMicrophoneDevice,
//     changeSpeakerDevice,
//   } = useDialer({ clientRef });

//   const [input, setInput] = useState("");
//   const { data: paramLead } = useLead(paramLeadId || "");

//   useEffect(() => {
//     if (paramLead?.phone) {
//       const cleanPhone = paramLead.phone.startsWith("91")
//         ? paramLead.phone
//         : `91${paramLead.phone}`;
//       setInput(cleanPhone);
//     }
//   }, [paramLead]);

//   // Connect WebRTC automatically if verified/elevated
//   useEffect(() => {
//     if (isAuthenticated) {
//       connect();
//     }
//   }, [isAuthenticated, connect]);

//   const handleVerifyAndConnect = (password: string) => {
//     if (
//       assignment?.stringeePassword &&
//       password !== assignment.stringeePassword
//     ) {
//       setAuthError("Invalid Stringee Password. Access denied.");
//       return;
//     }

//     setAuthError(null);
//     // Save verification flag for today
//     sessionStorage.setItem(storageKey, "true");
//     setIsAuthenticated(true);
//   };

//   const handleCloseModal = () => {
//     // Navigate back if user dismisses modal without authenticating
//     navigate(-1);
//   };

//   const isBusy =
//     callState !== "idle" && callState !== "ended" && callState !== "failed";

//   const handleCall = () => {
//     if (!input.trim() || status !== "connected") return;
//     makeCall(input.trim(), {
//       leadId: paramLead?._id || null,
//       userId: user?._id,
//       branchId: user?.branches?.[0],
//     });
//   };

//   if (!isElevatedRole && isLoadingAssignment) {
//     return (
//       <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
//         <span className="material-symbols-outlined animate-spin text-3xl text-primary">
//           progress_activity
//         </span>
//         <p className="text-xs font-semibold text-on-surface-variant">
//           Verifying Dialer Access Permissions...
//         </p>
//       </div>
//     );
//   }

//   if (
//     !isElevatedRole &&
//     (isError || !assignment || !assignment.stringeeUserId)
//   ) {
//     return (
//       <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
//         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
//           <span className="material-symbols-outlined text-3xl">
//             phone_disabled
//           </span>
//         </div>
//         <h2 className="font-headline-md text-xl font-extrabold text-on-surface">
//           Dialer Access Restricted
//         </h2>
//         <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
//           You currently do not have an assigned Stringee Virtual Line or active
//           credentials. Please contact your Administrator or Branch Manager to
//           configure your dialer access.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 relative">
//       {/* Modal required if not authenticated */}
//       {!isElevatedRole && !isAuthenticated && assignment && (
//         <DialerAccessModal
//           assignedUserId={assignment.stringeeUserId!}
//           onVerifyAndConnect={handleVerifyAndConnect}
//           onClose={handleCloseModal}
//           isConnecting={status === "connecting"}
//           error={authError || error}
//         />
//       )}

//       {/* Header Banner */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
//         <div>
//           <h1 className="font-headline-md text-2xl font-black text-on-surface tracking-tight">
//             Dialer
//           </h1>
//           <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
//             Real-time outbound voice communication powered by Stringee
//             {assignment?.phoneNumber && (
//               <span className="ml-2 font-mono font-bold text-primary">
//                 ({assignment.phoneNumber})
//               </span>
//             )}
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <span
//             className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
//               status === "connected"
//                 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
//                 : status === "connecting"
//                   ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
//                   : "bg-rose-500/10 text-rose-700 border-rose-500/20"
//             }`}
//           >
//             <span
//               className={`h-2 w-2 rounded-full ${
//                 status === "connected"
//                   ? "bg-emerald-500 animate-pulse"
//                   : status === "connecting"
//                     ? "bg-amber-500 animate-ping"
//                     : "bg-rose-500"
//               }`}
//             />
//             {status === "connecting" && "Connecting WebRTC…"}
//             {status === "connected" && "Service Online"}
//             {status === "error" && (error || "Connection Error")}
//             {status === "disconnected" && "Offline"}
//           </span>
//         </div>
//       </div>

//       {/* Main Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
//         <div className="lg:col-span-6 xl:col-span-5">
//           <KeypadConsole
//             input={input}
//             setInput={setInput}
//             isBusy={isBusy}
//             status={status}
//             error={error}
//             callState={callState}
//             durationSec={durationSec}
//             toNumber={toNumber}
//             onMakeCall={handleCall}
//             onHangup={hangup}
//             onReset={reset}
//             changeMicrophoneDevice={changeMicrophoneDevice}
//             changeSpeakerDevice={changeSpeakerDevice}
//           />
//         </div>

//         <div className="lg:col-span-6 xl:col-span-7">
//           <LeadContextCard
//             phoneNumber={input}
//             onSelectLeadPhone={(phone) => setInput(phone)}
//           />
//         </div>
//       </div>

//       <div>
//         <RecentCallLogsTable limit={10} onRedial={(phone) => setInput(phone)} />
//       </div>
//     </div>
//   );
// };

// export default Dialer;

// src/features/dialer/components/Dialer.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useStringeeClient } from "../hooks/useStringeeClient";
import { useDialer } from "../hooks/useDialer";
import { useAuthStore } from "@/store/auth.store";
import { useLead } from "@/features/leads/hooks/useLeads";
import { KeypadConsole } from "./KeypadConsole";
import { LeadContextCard } from "./LeadContextCard";
import { RecentCallLogsTable } from "./RecentCallLogsTable";
import { stringeeNumberApi } from "@/services/stringeeNumberApi";
import { DialerAccessModal } from "./DialerAccessModal";
import { ROLES } from "@/types/auth";

export const Dialer = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramLeadId = searchParams.get("leadId") || searchParams.get("phone");

  const isElevatedRole =
    user?.role === ROLES.HEAD ||
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.MANAGER;

  // Explicitly check if logged-in user is an Employee
  const isEmployee = user?.role === ROLES.EMPLOYEE;

  const storageKey = `dialer_auth_verified_${user?._id}`;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isElevatedRole) return true;
    return sessionStorage.getItem(storageKey) === "true";
  });

  const {
    data: assignment,
    isLoading: isLoadingAssignment,
    isError,
  } = useQuery({
    queryKey: ["my-stringee-assignment"],
    queryFn: stringeeNumberApi.getMyAssignment,
    enabled: !isElevatedRole && !!user,
    retry: false,
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [dialError, setDialError] = useState<string | null>(null);

  const { clientRef, status, error, connect } = useStringeeClient();
  const {
    callState,
    durationSec,
    toNumber,
    makeCall,
    hangup,
    reset,
    changeMicrophoneDevice,
    changeSpeakerDevice,
  } = useDialer({ clientRef });

  const [input, setInput] = useState("");
  const { data: paramLead } = useLead(paramLeadId || "");

  useEffect(() => {
    if (paramLead?.phone) {
      const cleanPhone = paramLead.phone.startsWith("91")
        ? paramLead.phone
        : `91${paramLead.phone}`;
      setInput(cleanPhone);
    }
  }, [paramLead]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
  }, [isAuthenticated, connect]);

  const handleVerifyAndConnect = (password: string) => {
    if (
      assignment?.stringeePassword &&
      password !== assignment.stringeePassword
    ) {
      setAuthError("Invalid Stringee Password. Access denied.");
      return;
    }

    setAuthError(null);
    sessionStorage.setItem(storageKey, "true");
    setIsAuthenticated(true);
  };

  const handleCloseModal = () => {
    navigate(-1);
  };

  const isBusy =
    callState !== "idle" && callState !== "ended" && callState !== "failed";

  const handleCall = () => {
    setDialError(null);
    const targetNumber = input.trim();
    if (!targetNumber || status !== "connected") return;

    // --- ASSIGNED LEAD VALIDATION FOR EMPLOYEES ---
    if (isEmployee) {
      const cleanInput = targetNumber.replace(/^\+?91/, "");
      const cleanParamLeadPhone = paramLead?.phone?.replace(/^\+?91/, "");

      // Verify that the dialed number belongs to an assigned lead loaded in state
      const matchesParamLead = paramLead && cleanParamLeadPhone === cleanInput;

      if (!matchesParamLead) {
        setDialError(
          "Access Denied: You are only allowed to dial assigned leads.",
        );
        return;
      }
    }

    makeCall(targetNumber, {
      leadId: paramLead?._id || null,
      userId: user?._id,
      branchId: user?.branches?.[0],
    });
  };

  if (!isElevatedRole && isLoadingAssignment) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
        <p className="text-xs font-semibold text-on-surface-variant">
          Verifying Dialer Access Permissions...
        </p>
      </div>
    );
  }

  if (
    !isElevatedRole &&
    (isError || !assignment || !assignment.stringeeUserId)
  ) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
          <span className="material-symbols-outlined text-3xl">
            phone_disabled
          </span>
        </div>
        <h2 className="font-headline-md text-xl font-extrabold text-on-surface">
          Dialer Access Restricted
        </h2>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
          You currently do not have an assigned Stringee Virtual Line or active
          credentials. Please contact your Administrator or Branch Manager to
          configure your dialer access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {!isElevatedRole && !isAuthenticated && assignment && (
        <DialerAccessModal
          assignedUserId={assignment.stringeeUserId!}
          onVerifyAndConnect={handleVerifyAndConnect}
          onClose={handleCloseModal}
          isConnecting={status === "connecting"}
          error={authError || error}
        />
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
        <div>
          <h1 className="font-headline-md text-2xl font-black text-on-surface tracking-tight">
            Dialer
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Real-time outbound voice communication powered by Stringee
            {assignment?.phoneNumber && (
              <span className="ml-2 font-mono font-bold text-primary">
                ({assignment.phoneNumber})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              status === "connected"
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                : status === "connecting"
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-700 border-rose-500/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "connecting"
                    ? "bg-amber-500 animate-ping"
                    : "bg-rose-500"
              }`}
            />
            {status === "connecting" && "Connecting WebRTC…"}
            {status === "connected" && "Service Online"}
            {status === "error" && (error || "Connection Error")}
            {status === "disconnected" && "Offline"}
          </span>
        </div>
      </div>

      {dialError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
          <span className="material-symbols-outlined text-base">block</span>
          {dialError}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 xl:col-span-5">
          <KeypadConsole
            input={input}
            setInput={(val) => {
              setDialError(null);
              // Block setInput updates if user is employee
              if (!isEmployee) setInput(val);
            }}
            isBusy={isBusy}
            status={status}
            error={error}
            callState={callState}
            durationSec={durationSec}
            toNumber={toNumber}
            onMakeCall={handleCall}
            onHangup={hangup}
            onReset={reset}
            changeMicrophoneDevice={changeMicrophoneDevice}
            changeSpeakerDevice={changeSpeakerDevice}
            isEmployee={isEmployee}
          />
        </div>

        <div className="lg:col-span-6 xl:col-span-7">
          <LeadContextCard
            phoneNumber={input}
            onSelectLeadPhone={(phone) => {
              setDialError(null);
              setInput(phone);
            }}
          />
        </div>
      </div>

      <div>
        <RecentCallLogsTable limit={10} onRedial={(phone) => setInput(phone)} />
      </div>
    </div>
  );
};

export default Dialer;
