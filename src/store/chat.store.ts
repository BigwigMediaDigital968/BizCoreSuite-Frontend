import { create } from "zustand";

interface ChatStore {
  /** Conversation currently open on the Chat page (null elsewhere). */
  activeRoomId: string | null;
  setActiveRoomId: (roomId: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeRoomId: null,
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
}));
