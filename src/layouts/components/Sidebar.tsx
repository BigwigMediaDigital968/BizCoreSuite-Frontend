import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";

import { ROUTES } from "@/config/routes";
import { useSidebarStore } from "@/store/sidebar.store";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, ROLES, type Permission, type Role } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";
import { usePendingLateCheckInCount } from "@/features/attendance/api/lateCheckInApi";
import { useReportWindow } from "@/features/dailyReports";
import { DAILY_REPORT_WINDOW_STATE } from "@/types/dailyReport";
import { useChatUnreadTotal } from "@/features/chat/hooks/useChat";

export interface NavChild {
  label: string;
  path: string;
  roles?: Role[];
  permissions?: Permission[];
  permissionMode?: "any" | "all";
  badgeCount?: number;
}

export interface NavItem {
  label: string;
  path?: string;
  icon: string;
  roles?: Role[];
  permissions?: Permission[];
  permissionMode?: "any" | "all";
  children?: NavChild[];
  badgeCount?: number;
}

export interface NavGroup {
  title: string;
  roles?: Role[];
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: ROUTES.dashboard,
        icon: "dashboard",
      },
      {
        label: "Chat",
        path: ROUTES.chat,
        icon: "chat",
      },
      {
        label: "Leads",
        icon: "group",
        permissions: [PERMISSIONS.LEAD_VIEW],
        children: [
          {
            label: "All Leads",
            path: ROUTES.leads,
            permissions: [PERMISSIONS.LEAD_VIEW],
          },
          {
            label: "My Leads",
            path: `${ROUTES.leads}?view=mine`,
            permissions: [PERMISSIONS.LEAD_VIEW],
            roles: [ROLES.EMPLOYEE],
          },
          {
            label: "Follow-ups",
            path: `${ROUTES.leads}?view=followups`,
            permissions: [PERMISSIONS.LEAD_FOLLOWUP_VIEW],
            roles: [ROLES.EMPLOYEE, ROLES.HEAD],
          },
        ],
      },
      {
        label: "Tasks",
        path: "/tasks",
        icon: "check_circle",
        permissions: [PERMISSIONS.TASK_VIEW],
      },
      {
        label: "Attendance",
        icon: "calendar_today",
        permissions: [PERMISSIONS.ATTENDANCE_VIEW],
        children: [
          {
            label: "My Attendance",
            path: ROUTES.attendance,
            roles: [ROLES.EMPLOYEE],
            permissions: [PERMISSIONS.ATTENDANCE_VIEW],
          },
          {
            label: "Team Attendance",
            path: "/attendance/team",
            roles: [ROLES.MANAGER],
            permissions: [PERMISSIONS.ATTENDANCE_REPORT],
          },
          {
            label: "Attendance Report",
            path: "/attendance/report",
            roles: [ROLES.HEAD, ROLES.ADMIN],
            permissions: [PERMISSIONS.ATTENDANCE_REPORT],
          },
          {
            label: "Late Approvals",
            path: "/attendance/late-approvals",
            permissions: [PERMISSIONS.LATE_CHECKIN_APPROVE],
          },
          {
            label: "My Late Requests",
            path: "/attendance/late-history",
            roles: [ROLES.EMPLOYEE],
            permissions: [PERMISSIONS.ATTENDANCE_VIEW],
          },
        ],
      },
      {
        label: "Leave",
        icon: "event_busy",
        permissions: [PERMISSIONS.LEAVE_VIEW],
        children: [
          {
            label: "My Leave",
            path: "/leave",
            roles: [ROLES.EMPLOYEE],
            permissions: [PERMISSIONS.LEAVE_VIEW],
          },
          {
            label: "Leave Approvals",
            path: "/leave/approvals",
            roles: [ROLES.HEAD, ROLES.ADMIN, ROLES.MANAGER],
            permissions: [PERMISSIONS.LEAVE_APPROVE, PERMISSIONS.LEAVE_REJECT],
          },
          {
            label: "Leave Balances",
            path: "/leave/balances",
            permissions: [PERMISSIONS.LEAVE_BALANCE_VIEW],
            roles: [ROLES.ADMIN, ROLES.HEAD, ROLES.MANAGER, ROLES.EMPLOYEE],
          },
          {
            label: "Leave Policies",
            path: "/leave/policies",
            permissions: [PERMISSIONS.LEAVE_POLICY_VIEW],
            roles: [ROLES.HEAD, ROLES.ADMIN],
          },
        ],
      },
      {
        label: "Daily Report",
        icon: "assignment",
        permissions: [
          PERMISSIONS.DAILY_REPORT_CREATE,
          PERMISSIONS.DAILY_REPORT_VIEW,
        ],
        children: [
          {
            label: "Today's Report",
            path: ROUTES.dailyReport,
            roles: [ROLES.EMPLOYEE],
            permissions: [PERMISSIONS.DAILY_REPORT_CREATE],
          },
          {
            label: "My Reports",
            path: ROUTES.dailyReportHistory,
            roles: [ROLES.EMPLOYEE],
            permissions: [PERMISSIONS.DAILY_REPORT_CREATE],
          },
          {
            label: "Team Reports",
            path: ROUTES.dailyReports,
            roles: [ROLES.HEAD, ROLES.ADMIN, ROLES.MANAGER],
            permissions: [PERMISSIONS.DAILY_REPORT_VIEW],
          },
        ],
      },
      {
        label: "Performance",
        path: "/performance",
        icon: "show_chart",
        permissions: [PERMISSIONS.PERFORMANCE_VIEW],
      },
      {
        label: "Revenue",
        path: "/revenue",
        icon: "payments",
        permissions: [PERMISSIONS.REVENUE_VIEW],
      },
      {
        label: "Contests",
        path: "/contests",
        icon: "military_tech",
        permissions: [PERMISSIONS.CONTEST_VIEW_ALL],
      },
      {
        label: "Live Contests",
        path: "/contests/live",
        icon: "emoji_events",
        roles: [ROLES.EMPLOYEE, ROLES.MANAGER],
      },
    ],
  },
  {
    title: "SYSTEM",
    roles: [ROLES.HEAD, ROLES.ADMIN, ROLES.MANAGER],
    items: [
      {
        label: "Employees",
        path: ROUTES.employees,
        icon: "badge",
        permissions: [PERMISSIONS.USER_VIEW],
      },
      {
        label: "Branches",
        path: ROUTES.branches,
        icon: "domain",
        permissions: [PERMISSIONS.BRANCH_VIEW],
      },
      {
        label: "Salary",
        path: ROUTES.salary,
        icon: "payments",
        roles: [ROLES.HEAD],
        permissions: [PERMISSIONS.SALARY_MANAGE],
      },
      {
        label: "Logs",
        path: ROUTES.logs,
        icon: "timer",
        permissions: [PERMISSIONS.AUDIT_VIEW],
      },
    ],
  },
];

const Sidebar = () => {
  const { collapsed, mobileOpen, closeMobileSidebar, toggleSidebar } = useSidebarStore();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const { hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  const canApproveLateCheckIn = hasAnyPermission([PERMISSIONS.LATE_CHECKIN_APPROVE]);
  const { data: pendingLateCount = 0 } = usePendingLateCheckInCount(canApproveLateCheckIn);

  const canSubmitDailyReport =
    user?.role === ROLES.EMPLOYEE &&
    hasAnyPermission([PERMISSIONS.DAILY_REPORT_CREATE]);
  const { data: reportWindow } = useReportWindow(canSubmitDailyReport);
  const dailyReportDue =
    !!reportWindow &&
    !reportWindow.report &&
    (reportWindow.state === DAILY_REPORT_WINDOW_STATE.OPEN ||
      reportWindow.state === DAILY_REPORT_WINDOW_STATE.LATE)
      ? 1
      : 0;

  const chatUnread = useChatUnreadTotal();

  const passesRoles = (roles?: Role[]) =>
    !roles?.length || (!!user?.role && roles.includes(user.role as Role));

  const canAccess = (entry: {
    roles?: Role[];
    permissions?: Permission[];
    permissionMode?: "any" | "all";
  }) => {
    if (!passesRoles(entry.roles)) {
      return false;
    }

    if (!entry.permissions?.length) {
      return true;
    }

    return entry.permissionMode === "all"
      ? hasAllPermissions(entry.permissions)
      : hasAnyPermission(entry.permissions);
  };

  const filteredNavGroups = useMemo(() => {
    if (isLoading) {
      return [];
    }

    return NAV_GROUPS.filter((group) => passesRoles(group.roles))
      .map((group) => {
        const items = group.items
          .map((item) => {
            if (!passesRoles(item.roles)) {
              return null;
            }

            const visibleChildren = item.children
              ?.filter((child) => canAccess(child))
              .map((child) => {
                if (child.path === "/attendance/late-approvals") {
                  return { ...child, badgeCount: pendingLateCount };
                }
                if (child.path === ROUTES.dailyReport) {
                  return { ...child, badgeCount: dailyReportDue };
                }
                return child;
              });

            if (!canAccess(item) && !visibleChildren?.length) {
              return null;
            }

            return {
              ...item,
              ...(item.path === ROUTES.chat ? { badgeCount: chatUnread } : {}),
              children: visibleChildren,
            };
          })
          .filter((item) => item !== null);

        return {
          ...group,
          items,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [isLoading, hasAnyPermission, hasAllPermissions, pendingLateCount, dailyReportDue, chatUnread, user?.role]);

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Leads: true,
    Attendance: true,
    "Daily Report": true,
  });

  const toggleSubmenu = (label: string) => {
    if (collapsed) {
      toggleSidebar();
      setOpenSubmenus((prev) => ({ ...prev, [label]: true }));
      return;
    }
    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-primary text-on-primary shadow-2xl transition-all duration-300 select-none ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5 shrink-0">
          <div className="flex h-16 shrink-0 items-center justify-center rounded-lg">
            <img
              src="/favicon-1.png"
              className="h-10 w-auto grayscale-100 brightness-0 invert-100"
              alt="Logo"
            />
          </div>

          {!collapsed && (
            <img
              src="/brand-name.png"
              className="h-10 w-auto grayscale-100 brightness-0 invert-100"
              alt="Brand"
            />
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {filteredNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold tracking-wider text-on-primary/50 uppercase mb-2">
                  {group.title}
                </p>
              )}

              {group.items.map((item) => {
                const hasChildren = Boolean(item?.children?.length);
                const isExpanded = Boolean(openSubmenus[item?.label]);
                const isChildActive = item?.children?.some(
                  (child) => location.pathname + location.search === child.path
                );

                const totalParentBadgeCount = item?.children?.reduce(
                  (acc, child) => acc + (child.badgeCount || 0),
                  0
                );

                if (!hasChildren && item?.path) {
                  return (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      onClick={closeMobileSidebar}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white/15 text-white font-semibold shadow-sm"
                            : "text-on-primary/75 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white" />
                          )}

                          <span className="material-symbols-outlined text-xl shrink-0">
                            {item.icon}
                          </span>

                          {!collapsed && (
                            <span className="truncate flex-1">{item.label}</span>
                          )}

                          {Boolean(item.badgeCount) && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                              {item.badgeCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                }

                return (
                  <div key={item?.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item?.label)}
                      title={collapsed ? item?.label : undefined}
                      className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                        isChildActive
                          ? "text-white font-semibold"
                          : "text-on-primary/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="material-symbols-outlined text-xl shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!collapsed ? (
                        <div className="flex items-center gap-2">
                          {Boolean(totalParentBadgeCount) && !isExpanded && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                              {totalParentBadgeCount}
                            </span>
                          )}
                          <span className="material-symbols-outlined text-lg">
                            {isExpanded ? "expand_less" : "expand_more"}
                          </span>
                        </div>
                      ) : (
                        Boolean(totalParentBadgeCount) && (
                          <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                        )
                      )}
                    </button>

                    {hasChildren && isExpanded && !collapsed && (
                      <div className="ml-9 space-y-1 border-l border-white/10 pl-3">
                        {item.children?.map((child) => (
                          <NavLink
                            key={child.label}
                            to={child.path}
                            onClick={closeMobileSidebar}
                            className={({ isActive }) =>
                              `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-white/15 text-white font-semibold"
                                  : "text-on-primary/70 hover:bg-white/10 hover:text-white"
                              }`
                            }
                          >
                            <span className="truncate">{child.label}</span>
                            {Boolean(child.badgeCount) && (
                              <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                                {child.badgeCount}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;