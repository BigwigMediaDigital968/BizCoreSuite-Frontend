// src/features/dialer/hooks/useDialer.ts
import { useRef, useCallback, useEffect, useState } from "react";
import { useCallStore } from "@/store/call.store";

interface UseDialerProps {
  clientRef: React.MutableRefObject<any>;
}

export const useDialer = ({ clientRef }: UseDialerProps) => {
  const {
    callState,
    durationSec,
    toNumber,
    callRef: storeCallRef,
    setCallState,
    setDurationSec,
    setToNumber,
    setCallRef,
    resetCallStore,
  } = useCallStore();

  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setDurationSec(0);
    timerRef.current = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
  }, [setDurationSec, stopTimer]);

  const cleanupAudioElements = () => {
    try {
      const remoteAudio = document.getElementById(
        "stringee-remote-audio"
      ) as HTMLAudioElement;
      const localAudio = document.getElementById(
        "stringee-local-audio"
      ) as HTMLAudioElement;

      if (remoteAudio) {
        remoteAudio.pause();
        remoteAudio.srcObject = null;
      }
      if (localAudio) {
        localAudio.pause();
        localAudio.srcObject = null;
      }
    } catch (e) {
      console.warn("[Dialer] Audio cleanup error:", e);
    }
  };

  const changeSpeakerDevice = useCallback((deviceId: string) => {
    const remoteAudio = document.getElementById("stringee-remote-audio") as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>;
    };

    if (remoteAudio && typeof remoteAudio.setSinkId === "function") {
      remoteAudio
        .setSinkId(deviceId)
        .then(() => console.log("[Dialer] Speaker output changed to:", deviceId))
        .catch((err) => console.warn("[Dialer] Speaker change error:", err));
    }
  }, []);

  // Change Microphone Input Device
  const changeMicrophoneDevice = useCallback(
    (deviceId: string) => {
      if (storeCallRef && typeof storeCallRef.changeAudioDevice === "function") {
        storeCallRef.changeAudioDevice(deviceId);
      }
    },
    [storeCallRef]
  );

  // Keep duration timer active during page routes
  useEffect(() => {
    if (callState === "active" && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState, setDurationSec]);

  const makeCall = useCallback(
    (targetNumber: string, customData?: Record<string, any>) => {
      if (!clientRef.current) {
        console.error("[Dialer] StringeeClient is not connected");
        return;
      }

      const cleanNumber = targetNumber.replace(/[^\d+]/g, "");
      setToNumber(cleanNumber);
      setCallState("calling");
      setIsMuted(false);

      const StringeeCall = (window as any).StringeeCall;
      if (!StringeeCall) {
        console.error("[Dialer] StringeeCall SDK not found");
        setCallState("failed");
        return;
      }

      const call = new StringeeCall(
        clientRef.current,
        clientRef.current.userId || "agent",
        cleanNumber,
        false
      );

      if (customData) {
        call.customData =
          typeof customData === "object"
            ? JSON.stringify(customData)
            : customData;
      }

      setCallRef(call);

      // --- WebRTC Media Event Handlers ---
      call.on("addlocalstream", (stream: MediaStream) => {
        const localAudio = document.getElementById(
          "stringee-local-audio"
        ) as HTMLAudioElement;
        if (localAudio && stream) {
          localAudio.srcObject = stream;
        }
      });

      call.on("addremotestream", (stream: MediaStream) => {
        const remoteAudio = document.getElementById(
          "stringee-remote-audio"
        ) as HTMLAudioElement;
        if (remoteAudio && stream) {
          remoteAudio.srcObject = stream;
          remoteAudio
            .play()
            .catch((err) =>
              console.warn("[Dialer] Autoplay error, resuming stream:", err)
            );
        }
      });

      // --- Signaling state listener ---
      call.on("signalingstate", (state: any) => {
        const code = state.code;

        // 1: Ringing, 3: Connected/Answered, 4: Busy, 5: Ended/Cut by Remote, 6: Answered Elsewhere
        if (code === 1) {
          setCallState("ringing");
        } else if (code === 3) {
          setCallState("active");
          startTimer();
        } else if (code === 4 || code === 5 || code === 6) {
          setCallState("ended");
          stopTimer();
          cleanupAudioElements();
        }
      });


      // --- Fixed Media state listener ---
      call.on("mediastate", (state: any) => {
        // state.code 1 = Connected (Media streams linked)
        // state.code 2 = Disconnected (Media lost)
        if (state.code === 1) {
          const remoteAudio = document.getElementById(
            "stringee-remote-audio"
          ) as HTMLAudioElement;
          if (remoteAudio && remoteAudio.paused) {
            remoteAudio.play().catch(() => { });
          }
        } else if (state.code === 2) {
          setCallState("ended");
          stopTimer();
          cleanupAudioElements();
        }
      });

      call.on("error", (err: any) => {
        console.error("[Dialer] Call error:", err);
        setCallState("failed");
        stopTimer();
        cleanupAudioElements();
      });

      // Execute Call
      call.makeCall((res: any) => {
        if (res?.r !== 0) {
          console.error("[Dialer] Call initiation failed:", res?.message);
          setCallState("failed");
          stopTimer();
          cleanupAudioElements();
        }
      });
    },
    [clientRef, setCallState, setToNumber, setCallRef, startTimer, stopTimer]
  );

  // Mute / Unmute handler
  const toggleMute = useCallback(() => {
    if (!storeCallRef) return;
    const targetMuteState = !isMuted;
    storeCallRef.mute(targetMuteState);
    setIsMuted(targetMuteState);
  }, [storeCallRef, isMuted]);

  // Safe hangup function
  // Safe hangup function inside useDialer.ts
  const hangup = useCallback(() => {
    const isClientConnected = clientRef.current && clientRef.current.hasConnected;

    if (storeCallRef && isClientConnected) {
      try {
        // Check if call object still exists internally before invoking hangup
        storeCallRef.hangup((res: any) => {
          console.log("[Dialer] Hangup response:", res);
        });
      } catch (err) {
        console.warn("[Dialer] Exception during call hangup:", err);
      }
    }

    // Ensure UI and timers clean up gracefully regardless of SDK errors
    setCallRef(null);
    setCallState("ended");
    stopTimer();
    cleanupAudioElements();
  }, [storeCallRef, clientRef, setCallRef, setCallState, stopTimer]);

  const reset = useCallback(() => {
    resetCallStore();
    setIsMuted(false);
    stopTimer();
    cleanupAudioElements();
  }, [resetCallStore, stopTimer]);

  return {
    callState,
    durationSec,
    toNumber,
    isMuted,
    changeSpeakerDevice,
  changeMicrophoneDevice,
    makeCall,
    toggleMute,
    hangup,
    reset,
  };
};