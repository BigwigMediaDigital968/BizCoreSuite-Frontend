import { create } from "zustand";

interface SidebarStore {
  collapsed: boolean;

  mobileOpen: boolean;

  toggleSidebar: () => void;

  toggleMobileSidebar: () => void;

  closeMobileSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  collapsed: false,

  mobileOpen: false,

  toggleSidebar: () =>
    set((state) => ({
      collapsed: !state.collapsed,
    })),

  toggleMobileSidebar: () =>
    set((state) => ({
      mobileOpen: !state.mobileOpen,
    })),

  closeMobileSidebar: () =>
    set({
      mobileOpen: false,
    }),
}));