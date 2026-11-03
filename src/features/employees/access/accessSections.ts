import type { ComponentType } from "react";
import ChatAccessSection from "@/features/chat/components/ChatAccessSection";
import { PERMISSIONS, type Permission, type Role } from "@/types/auth";

/** What every section on the Access tab is given. */
export interface AccessSectionProps {
  /** The person whose access is being edited. */
  userId: string;
  userName: string;
  targetRole: Role;
}

export interface AccessSection {
  id: string;
  title: string;
  /** One line on what this area controls. */
  description: string;
  /** Material Symbols icon name. */
  icon: string;
  /** Who may see and change this section. */
  permission: Permission | Permission[];
  /** The section body. It owns its own loading, saving and error states. */
  Component: ComponentType<AccessSectionProps>;
}

/**
 * The areas whose access can be changed per person. To add one (leads, tasks,
 * reports, ...): build its body component, then add an entry here. The Access
 * tab, its permission check and the page layout need no other change.
 */
export const ACCESS_SECTIONS: AccessSection[] = [
  {
    id: "chat",
    title: "Chat",
    description: "Who this person can message directly.",
    icon: "forum",
    permission: PERMISSIONS.CHAT_MANAGE,
    Component: ChatAccessSection,
  },
];

/** Every permission that unlocks at least one section (for showing the tab). */
export const ACCESS_PERMISSIONS: Permission[] = ACCESS_SECTIONS.flatMap((s) =>
  Array.isArray(s.permission) ? s.permission : [s.permission]
);
