import { create } from "zustand";

interface ModalStore {
  activeModal: string | null;

  openModal: (id: string) => void;

  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,

  openModal: (activeModal) =>
    set({
      activeModal,
    }),

  closeModal: () =>
    set({
      activeModal: null,
    }),
}));