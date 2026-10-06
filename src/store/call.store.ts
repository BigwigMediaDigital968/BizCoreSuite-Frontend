// src/store/call.store.ts
import type { Lead } from "@/types/lead";
import { create } from "zustand";

export type CallState = "idle" | "calling" | "ringing" | "active" | "ended" | "failed";

interface CallStoreState {
    callState: CallState;
    durationSec: number;
    toNumber: string;
    callRef: any | null;
    activeLead: Lead | null; // <-- Added here

    setCallState: (state: CallState) => void;
    setDurationSec: (updater: number | ((prev: number) => number)) => void;
    setToNumber: (num: string) => void;
    setCallRef: (call: any) => void;
    resetCallStore: () => void;
        setActiveLead: (lead: Lead | null) => void; // <-- Added here

}

export const useCallStore = create<CallStoreState>((set) => ({
    callState: "idle",
    durationSec: 0,
    toNumber: "",
    callRef: null,
    activeLead: null, // <-- Default

    setCallState: (callState) => set({ callState }),
    setDurationSec: (updater) =>
        set((state) => ({
            durationSec: typeof updater === "function" ? updater(state.durationSec) : updater,
        })),
    setToNumber: (toNumber) => set({ toNumber }),
    setCallRef: (callRef) => set({ callRef }),
    setActiveLead: (activeLead) => set({ activeLead }), // <-- Setter

    resetCallStore: () =>
        set({
            callState: "idle",
            durationSec: 0,
            toNumber: "",
            callRef: null,
        }),
}));