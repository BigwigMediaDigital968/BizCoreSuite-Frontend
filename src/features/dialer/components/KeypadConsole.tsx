// // src/features/dialer/components/KeypadConsole.tsx

// import React, { useState } from "react";
// import { useCallStore } from "@/store/call.store";
// import AudioDeviceSelector from "./AudioDeviceSelector";

// interface KeypadConsoleProps {
//   input: string;
//   setInput: React.Dispatch<React.SetStateAction<string>>;
//   isBusy: boolean;
//   status: string;
//   error: string | null;
//   callState: string;
//   durationSec: number;
//   toNumber: string;
//   onMakeCall: () => void;
//   onHangup: () => void;
//   onReset: () => void;
//   changeSpeakerDevice: (deviceId: string) => void;
//   changeMicrophoneDevice: (deviceId: string) => void;
// }

// const KEYPAD_KEYS = [
//   { digit: "1", sub: "" },
//   { digit: "2", sub: "ABC" },
//   { digit: "3", sub: "DEF" },
//   { digit: "4", sub: "GHI" },
//   { digit: "5", sub: "JKL" },
//   { digit: "6", sub: "MNO" },
//   { digit: "7", sub: "PQRS" },
//   { digit: "8", sub: "TUV" },
//   { digit: "9", sub: "WXYZ" },
//   { digit: "*", sub: "" },
//   { digit: "0", sub: "+" },
//   { digit: "#", sub: "" },
// ];

// const formatDuration = (sec: number) => {
//   const m = String(Math.floor(sec / 60)).padStart(2, "0");
//   const s = String(sec % 60).padStart(2, "0");
//   return `${m}:${s}`;
// };

// export const KeypadConsole: React.FC<KeypadConsoleProps> = ({
//   input,
//   setInput,
//   isBusy,
//   status,
//   callState,
//   durationSec,
//   toNumber,
//   onMakeCall,
//   onHangup,
//   onReset,
//   changeSpeakerDevice,
//   changeMicrophoneDevice,
// }) => {
//   const [isMuted, setIsMuted] = useState(false);
//   const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
//   const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  
//   const [activeMicId, setActiveMicId] = useState<string>("");
//   const [activeSpeakerId, setActiveSpeakerId] = useState<string>("");

//   const callRef = useCallStore((s) => s.callRef);

//   const handleKeyPress = (digit: string) => {
//     if (isBusy && callRef?.sendDtmf) {
//       callRef.sendDtmf(digit);
//       return;
//     }
//     setInput((prev) => prev + digit);
//   };

//   const handleBackspace = () => {
//     if (isBusy) return;
//     setInput((prev) => prev.slice(0, -1));
//   };

//   const handleToggleMute = () => {
//     if (!callRef) return;
//     const nextMute = !isMuted;
//     setIsMuted(nextMute);
//     callRef.mute(nextMute);
//   };

//   const handleSpeakerChange = (id: string) => {
//     setActiveSpeakerId(id);
//     changeSpeakerDevice(id);
//   };

//   const handleMicChange = (id: string) => {
//     setActiveMicId(id);
//     changeMicrophoneDevice(id);
//   };

//   return (
//     <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-5">
      
//       {/* Quick Audio Bar (Available Before & During Call) */}
//       <div className="relative flex items-center justify-between rounded-xl bg-surface-container-low/60 border border-outline-variant/20 px-3.5 py-2 text-xs">
//         <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-medium truncate">
//           <span className="material-symbols-outlined text-base text-primary">tune</span>
//           <span className="truncate">
//             Audio Configured
//           </span>
//         </div>

//         <button
//           type="button"
//           onClick={() => setIsDeviceMenuOpen((prev) => !prev)}
//           className="flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors"
//         >
//           <span>Devices</span>
//           <span className="material-symbols-outlined text-sm">
//             {isDeviceMenuOpen ? "expand_less" : "expand_more"}
//           </span>
//         </button>

//         {/* Floating Audio Device Picker Dropdown */}
//         <AudioDeviceSelector
//           isOpen={isDeviceMenuOpen}
//           onClose={() => setIsDeviceMenuOpen(false)}
//           selectedMicId={activeMicId}
//           selectedSpeakerId={activeSpeakerId}
//           onSelectSpeaker={handleSpeakerChange}
//           onSelectMicrophone={handleMicChange}
//         />
//       </div>

//       {/* Screen HUD / Input */}
//       <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 p-4 min-h-[100px] flex flex-col justify-center items-center relative overflow-hidden">
//         {!isBusy ? (
//           <div className="w-full space-y-2">
//             <div className="flex items-center justify-between">
//               <input
//                 type="tel"
//                 placeholder="Enter phone number..."
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 disabled={isBusy}
//                 className="w-full bg-transparent text-center font-headline-md text-2xl font-bold tracking-wider text-on-surface outline-none placeholder:text-on-surface-variant/40 placeholder:text-base"
//               />

//               {input && (
//                 <button
//                   type="button"
//                   onClick={handleBackspace}
//                   className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all"
//                 >
//                   <span className="material-symbols-outlined text-xl">backspace</span>
//                 </button>
//               )}
//             </div>
//           </div>
//         ) : (
//           <div className="text-center space-y-1.5 py-1">
//             <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary animate-pulse">
//               {callState === "active" ? "Call In Progress" : callState}
//             </span>

//             <p className="font-headline-sm text-2xl font-black text-on-surface tracking-wider">
//               {toNumber}
//             </p>

//             <p className="font-mono text-sm font-semibold text-primary">
//               {callState === "active" ? formatDuration(durationSec) : "Connecting..."}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Keypad Grid (Visible before call, or toggled in-call for DTMF) */}
//       {(!isBusy || showInCallKeypad) && (
//         <div className="grid grid-cols-3 gap-2.5">
//           {KEYPAD_KEYS.map((k) => (
//             <button
//               key={k.digit}
//               type="button"
//               onClick={() => handleKeyPress(k.digit)}
//               className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high active:scale-95 border border-outline-variant/20 transition-all group"
//             >
//               <span className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary">
//                 {k.digit}
//               </span>
//               <span className="font-label-sm text-[8px] font-semibold text-on-surface-variant/60 tracking-widest h-2.5">
//                 {k.sub}
//               </span>
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Action Controls */}
//       <div className="space-y-3 pt-1">
//         {!isBusy ? (
//           <button
//             type="button"
//             onClick={onMakeCall}
//             disabled={status !== "connected" || !input.trim()}
//             className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-label-md text-sm font-bold text-on-primary shadow-md hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-[0.99]"
//           >
//             <span className="material-symbols-outlined text-xl">call</span>
//             Start Call
//           </button>
//         ) : (
//           <div className="space-y-3">
//             <div className="grid grid-cols-2 gap-2.5">
//               {/* Mute Button */}
//               <button
//                 type="button"
//                 onClick={handleToggleMute}
//                 className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
//                   isMuted
//                     ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
//                     : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
//                 }`}
//               >
//                 <span className="material-symbols-outlined text-lg">
//                   {isMuted ? "mic_off" : "mic"}
//                 </span>
//                 {isMuted ? "Muted" : "Mute"}
//               </button>

//               {/* In-Call Keypad Toggle */}
//               <button
//                 type="button"
//                 onClick={() => setShowInCallKeypad((prev) => !prev)}
//                 className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
//                   showInCallKeypad
//                     ? "bg-primary/10 text-primary border-primary/30"
//                     : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
//                 }`}
//               >
//                 <span className="material-symbols-outlined text-lg">dialpad</span>
//                 {showInCallKeypad ? "Hide Keypad" : "Keypad"}
//               </button>
//             </div>

//             {/* End Call */}
//             <button
//               type="button"
//               onClick={onHangup}
//               className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 font-label-md text-sm font-bold text-white hover:bg-rose-700 shadow-md transition-all active:scale-[0.99]"
//             >
//               <span className="material-symbols-outlined text-xl">call_end</span>
//               End Call
//             </button>
//           </div>
//         )}

//         {/* Start Another Call Button */}
//         {callState === "ended" && (
//           <button
//             type="button"
//             onClick={onReset}
//             className="w-full py-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-primary hover:bg-surface-container-high transition-all"
//           >
//             + Start Another Call
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// src/features/dialer/components/KeypadConsole.tsx

import React, { useState } from "react";
import { useCallStore } from "@/store/call.store";
import AudioDeviceSelector from "./AudioDeviceSelector";

interface KeypadConsoleProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isBusy: boolean;
  status: string;
  error: string | null;
  callState: string;
  durationSec: number;
  toNumber: string;
  onMakeCall: () => void;
  onHangup: () => void;
  onReset: () => void;
  changeSpeakerDevice: (deviceId: string) => void;
  changeMicrophoneDevice: (deviceId: string) => void;
  isEmployee?: boolean; // Added prop to lock input/keypad for regular employees
}

const KEYPAD_KEYS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

const formatDuration = (sec: number) => {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export const KeypadConsole: React.FC<KeypadConsoleProps> = ({
  input,
  setInput,
  isBusy,
  status,
  callState,
  durationSec,
  toNumber,
  onMakeCall,
  onHangup,
  onReset,
  changeSpeakerDevice,
  changeMicrophoneDevice,
  isEmployee = false,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);

  const [activeMicId, setActiveMicId] = useState<string>("");
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>("");

  const callRef = useCallStore((s) => s.callRef);

  const handleKeyPress = (digit: string) => {
    // During an active call, send DTMF tones
    if (isBusy && callRef?.sendDtmf) {
      callRef.sendDtmf(digit);
      return;
    }
    // Block manual key typing for employees prior to call setup
    if (isEmployee) return;

    setInput((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (isBusy || isEmployee) return;
    setInput((prev) => prev.slice(0, -1));
  };

  const handleToggleMute = () => {
    if (!callRef) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    callRef.mute(nextMute);
  };

  const handleSpeakerChange = (id: string) => {
    setActiveSpeakerId(id);
    changeSpeakerDevice(id);
  };

  const handleMicChange = (id: string) => {
    setActiveMicId(id);
    changeMicrophoneDevice(id);
  };

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-5">
      {/* Quick Audio Bar */}
      <div className="relative flex items-center justify-between rounded-xl bg-surface-container-low/60 border border-outline-variant/20 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-medium truncate">
          <span className="material-symbols-outlined text-base text-primary">
            tune
          </span>
          <span className="truncate">Audio Configured</span>
        </div>

        <button
          type="button"
          onClick={() => setIsDeviceMenuOpen((prev) => !prev)}
          className="flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <span>Devices</span>
          <span className="material-symbols-outlined text-sm">
            {isDeviceMenuOpen ? "expand_less" : "expand_more"}
          </span>
        </button>

        <AudioDeviceSelector
          isOpen={isDeviceMenuOpen}
          onClose={() => setIsDeviceMenuOpen(false)}
          selectedMicId={activeMicId}
          selectedSpeakerId={activeSpeakerId}
          onSelectSpeaker={handleSpeakerChange}
          onSelectMicrophone={handleMicChange}
        />
      </div>

      {/* Screen HUD / Input Display */}
      <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 p-4 min-h-[100px] flex flex-col justify-center items-center relative overflow-hidden">
        {!isBusy ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <input
                type="tel"
                placeholder={
                  isEmployee
                    ? "Select an assigned lead to dial..."
                    : "Enter phone number..."
                }
                value={input}
                onChange={(e) => {
                  if (!isEmployee) setInput(e.target.value);
                }}
                readOnly={isEmployee}
                disabled={isBusy}
                className={`w-full bg-transparent text-center font-headline-md text-2xl font-bold tracking-wider text-on-surface outline-none placeholder:text-on-surface-variant/40 placeholder:text-xs sm:placeholder:text-sm ${
                  isEmployee ? "cursor-not-allowed select-none" : ""
                }`}
              />

              {input && !isEmployee && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-xl">
                    backspace
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1.5 py-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary animate-pulse">
              {callState === "active" ? "Call In Progress" : callState}
            </span>

            <p className="font-headline-sm text-2xl font-black text-on-surface tracking-wider">
              {toNumber}
            </p>

            <p className="font-mono text-sm font-semibold text-primary">
              {callState === "active"
                ? formatDuration(durationSec)
                : "Connecting..."}
            </p>
          </div>
        )}
      </div>

      {/* Keypad Grid (Disabled for Employees outside active calls) */}
      {(!isBusy || showInCallKeypad) && (
        <div className="grid grid-cols-3 gap-2.5">
          {KEYPAD_KEYS.map((k) => (
            <button
              key={k.digit}
              type="button"
              onClick={() => handleKeyPress(k.digit)}
              disabled={isEmployee && !isBusy}
              className={`flex flex-col items-center justify-center py-2.5 rounded-xl border border-outline-variant/20 transition-all group ${
                isEmployee && !isBusy
                  ? "bg-surface-container-low/40 opacity-50 cursor-not-allowed"
                  : "bg-surface-container-low hover:bg-surface-container-high active:scale-95"
              }`}
            >
              <span
                className={`font-headline-sm text-lg font-bold ${
                  isEmployee && !isBusy
                    ? "text-on-surface-variant/40"
                    : "text-on-surface group-hover:text-primary"
                }`}
              >
                {k.digit}
              </span>
              <span className="font-label-sm text-[8px] font-semibold text-on-surface-variant/60 tracking-widest h-2.5">
                {k.sub}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action Controls */}
      <div className="space-y-3 pt-1">
        {!isBusy ? (
          <button
            type="button"
            onClick={onMakeCall}
            disabled={status !== "connected" || !input.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-label-md text-sm font-bold text-on-primary shadow-md hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-xl">call</span>
            Start Call
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
                  isMuted
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                    : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isMuted ? "mic_off" : "mic"}
                </span>
                {isMuted ? "Muted" : "Mute"}
              </button>

              <button
                type="button"
                onClick={() => setShowInCallKeypad((prev) => !prev)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
                  showInCallKeypad
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  dialpad
                </span>
                {showInCallKeypad ? "Hide Keypad" : "Keypad"}
              </button>
            </div>

            <button
              type="button"
              onClick={onHangup}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 font-label-md text-sm font-bold text-white hover:bg-rose-700 shadow-md transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-xl">
                call_end
              </span>
              End Call
            </button>
          </div>
        )}

        {callState === "ended" && (
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-primary hover:bg-surface-container-high transition-all"
          >
            + Start Another Call
          </button>
        )}
      </div>
    </div>
  );
};