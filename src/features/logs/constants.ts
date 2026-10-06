// Mirrors backend AUDIT_ACTIONS / AUDIT_ENTITIES — kept as a plain list on the
// frontend since this is only used to populate filter dropdowns.
export const AUDIT_ACTION_OPTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "SESSION_CREATED",
  "SESSION_REVOKED",
  "ALL_SESSIONS_REVOKED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_ROLE_UPDATED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "BRANCH_CREATED",
  "BRANCH_UPDATED",
  "BRANCH_ACTIVATED",
  "BRANCH_DEACTIVATED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
] as const;

export const AUDIT_ENTITY_OPTIONS = [
  "User",
  "Branch",
  "Session",
  "Auth",
  "Lead",
  "Contact",
  "Deal",
  "Task",
] as const;

export const AUDIT_LOG_PAGE_SIZE = 20;