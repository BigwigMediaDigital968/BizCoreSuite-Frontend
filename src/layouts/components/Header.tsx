// import { useState } from "react";
// import { useAuthStore } from "@/store/auth.store";
// import { useSidebarStore } from "@/store/sidebar.store";
// import { useLogout } from "@/hooks/useAuth";
// import { Link } from "react-router";
// import QuickAddMenu from "./QuickAddMenu";
// import { Can } from "@/components/Auth/Can";
// import { ROLES } from "@/types/auth";

// const Header = () => {
//   const user = useAuthStore((s) => s.user);
//   const { mutate: logout, isPending } = useLogout();
//   const { collapsed, toggleSidebar, toggleMobileSidebar } = useSidebarStore();
//   const [profileOpen, setProfileOpen] = useState(false);

//   // Fallback initials calculation
//   const initials =
//     user?.name
//       ?.split(" ")
//       .map((n) => n[0])
//       .slice(0, 2)
//       .join("")
//       .toUpperCase() ?? "GU";

//   return (
//     <header
//       className={`fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/30 bg-surface/85 px-4 backdrop-blur-md transition-all duration-300 sm:px-6 ${
//         collapsed ? "lg:left-20" : "lg:left-64"
//       }`}
//     >
//       {/* Left Action & Search Section */}
//       <div className="flex flex-1 items-center gap-3">
//         {/* Mobile Toggle Button */}
//         <button
//           onClick={toggleMobileSidebar}
//           aria-label="Toggle Mobile Menu"
//           className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface lg:hidden transition-colors"
//         >
//           <span className="material-symbols-outlined text-2xl">menu</span>
//         </button>

//         {/* Desktop Collapse Toggle */}
//         <button
//           onClick={toggleSidebar}
//           aria-label="Toggle Sidebar"
//           className="hidden h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface lg:flex transition-colors"
//         >
//           <span className="material-symbols-outlined text-2xl">
//             {collapsed ? "menu" : "menu_open"}
//           </span>
//         </button>

//         {/* Search Bar */}
//         <div className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all md:flex">
//           <span className="material-symbols-outlined text-xl text-on-surface-variant/70">
//             search
//           </span>
//           <input
//             type="text"
//             placeholder="Search leads, employees..."
//             className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
//           />
//           <kbd className="hidden rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant/70 xl:inline-block">
//             ⌘K
//           </kbd>
//         </div>
//       </div>

//       {/* Right Controls Section */}
//       <div className="flex items-center gap-3 sm:gap-4">
//         {/* Quick Add Action Button */}
//         <Can permission={["user:create", "lead:create", "branch:create"]}>
//           <QuickAddMenu />
//         </Can>

//         {/* Notification Icon */}
//         {/* <button
//           aria-label="Notifications"
//           className="relative flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
//         >
//           <span className="material-symbols-outlined text-xl">notifications</span>
//           <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
//             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
//             <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
//           </span>
//         </button> */}

//         <div className="h-6 w-px bg-outline-variant/40" />

//         {/* User Profile Menu */}
//         <div
//           className="relative"
//           onMouseEnter={() => setProfileOpen(true)}
//           onMouseLeave={() => setProfileOpen(false)}
//         >
//           <button
//             onClick={() => setProfileOpen((prev) => !prev)}
//             className="flex items-center gap-3 rounded-xl p-1 text-left hover:bg-surface-container-high transition-colors focus:outline-none"
//           >
//             <div className="hidden text-right sm:block">
//               <p className="text-xs font-semibold leading-none text-on-surface">
//                 {user?.name ?? "Guest User"}
//               </p>
//               <p className="mt-1 text-[10px] font-bold leading-none tracking-wider text-on-surface-variant/70 uppercase">
//                 {user?.role ?? "Member"}
//               </p>
//             </div>
//             <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm ring-2 ring-primary/20">
//               {initials}
//             </div>
//           </button>

//           {/* Profile Dropdown Menu */}
//           {profileOpen && (
//             <>
//               {/* Click-outside backdrop for touch screens / mobile */}
//               <div
//                 className="fixed inset-0 z-40 sm:hidden"
//                 onClick={() => setProfileOpen(false)}
//               />

//               <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1.5 shadow-xl transition-all">
//                 <div className="px-3 py-2 sm:hidden border-b border-outline-variant/20 mb-1">
//                   <p className="text-xs font-semibold text-on-surface">
//                     {user?.name ?? "Guest User"}
//                   </p>
//                   <p className="text-[10px] text-on-surface-variant uppercase">
//                     {user?.role ?? "Member"}
//                   </p>
//                 </div>

//                 <Link
//                   to="/profile"
//                   onClick={() => setProfileOpen(false)}
//                   className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
//                 >
//                   <span className="material-symbols-outlined text-lg text-on-surface-variant">
//                     person
//                   </span>
//                   My Profile
//                 </Link>

//                 {/* Manager/Employee only — Head/Admin aren't scoped to a
//                     single branch, so "My Branch" isn't meaningful for them. */}
//                 {(user?.role === ROLES.MANAGER || user?.role === ROLES.EMPLOYEE) &&
//                   user?.branches?.[0] && (
//                   <Link
//                     to={`/branches/${user.branches[0]}`}
//                     onClick={() => setProfileOpen(false)}
//                     className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
//                   >
//                     <span className="material-symbols-outlined text-lg text-on-surface-variant">
//                       business
//                     </span>
//                     My Branch
//                   </Link>
//                 )}

//                 <div className="my-1 border-t border-outline-variant/20" />

//                 <button
//                   onClick={() => logout()}
//                   disabled={isPending}
//                   className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-error hover:bg-error-container/20 transition-colors"
//                 >
//                   <span className="material-symbols-outlined text-lg">
//                     logout
//                   </span>
//                   {isPending ? "Logging out..." : "Log out"}
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { useSidebarStore } from "@/store/sidebar.store";
import { useLogout } from "@/hooks/useAuth";
import QuickAddMenu from "./QuickAddMenu";
import NotificationBell from "./NotificationBell";
import { Can } from "@/components/Auth/Can";
import { ROLES, type Role } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { SearchRegistry, type SearchableItem } from "@/config/searchRegistry";
import { ROUTES } from "@/config/routes";

const Header = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { mutate: logout, isPending } = useLogout();
  const { collapsed, toggleSidebar, toggleMobileSidebar } = useSidebarStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { hasAnyPermission } = usePermissions();

  // Filter searchable actions based on current user role & permissions
  const allowedSearchItems = useMemo(() => {
    return SearchRegistry.items.filter((item) => {
      if (
        item.roles?.length &&
        (!user?.role || !item.roles.includes(user.role as Role))
      ) {
        return false;
      }
      if (item.permissions?.length) {
        return item.permissions.some((p) => hasAnyPermission([p]));
      }
      return true;
    });
  }, [user?.role, hasAnyPermission]);

  // Filter based on input search terms
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allowedSearchItems.slice(0, 6);
    }
    const q = searchQuery.toLowerCase().trim();
    return allowedSearchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [searchQuery, allowedSearchItems]);

  // Handle global keybindings: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (item: SearchableItem) => {
    setSearchFocused(false);
    setSearchQuery("");
    navigate(item.path);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1,
      );
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "GU";

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md transition-all duration-300 sm:px-6 ${
        collapsed ? "lg:left-20" : "lg:left-64"
      }`}
    >
      {/* Left Action & Direct Search Bar */}
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Toggle Mobile Menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:flex transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">
            {collapsed ? "menu" : "menu_open"}
          </span>
        </button>

        {/* Direct Integrated Search Bar Container */}
        <div ref={searchContainerRef} className="relative max-w-md flex-1">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-slate-50/80 px-3 py-1.5 transition-all ${
              searchFocused
                ? "border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-xs"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="material-symbols-outlined text-xl text-slate-400 shrink-0">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => {
                setSearchFocused(true);
                setSelectedIndex(0);
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search modules, leads, actions..."
              className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 text-xs shrink-0"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            ) : (
              <kbd className="hidden rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-block shrink-0">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Inline Search Dropdown Menu */}
          {searchFocused && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="max-h-80 overflow-y-auto p-1 space-y-0.5">
                {searchResults.length === 0 ? (
                  <div className="py-6 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-600">
                      No matching results
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching "Leads", "Tasks", or "Attendance"
                    </p>
                  </div>
                ) : (
                  searchResults.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                          isSelected
                            ? "bg-indigo-50/80 text-indigo-950"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">
                              {item.icon}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-2">
                          {item.category}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Helper Footer */}
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    <kbd className="bg-white border rounded px-1 font-mono">
                      ↑↓
                    </kbd>{" "}
                    navigate
                  </span>
                  <span>
                    <kbd className="bg-white border rounded px-1 font-mono">
                      ↵
                    </kbd>{" "}
                    select
                  </span>
                </div>
                <span>
                  <kbd className="bg-white border rounded px-1 font-mono">
                    esc
                  </kbd>{" "}
                  close
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Add Action Button */}
        <Can permission={["user:create", "lead:create", "branch:create"]}>
          <QuickAddMenu />
        </Can>

        <NotificationBell />

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Menu */}
        <div
          className="relative"
          onMouseEnter={() => setProfileOpen(true)}
          onMouseLeave={() => setProfileOpen(false)}
        >
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl p-1 text-left hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-none text-slate-800">
                {user?.name ?? "Guest User"}
              </p>
              <p className="mt-1 text-[10px] font-bold leading-none tracking-wider text-slate-400 uppercase">
                {user?.role ?? "Member"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs ring-2 ring-indigo-500/20">
              {initials}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40 sm:hidden"
                onClick={() => setProfileOpen(false)}
              />

              <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all">
                <div className="px-3 py-2 sm:hidden border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-800">
                    {user?.name ?? "Guest User"}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase">
                    {user?.role ?? "Member"}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-slate-400">
                    person
                  </span>
                  My Profile
                </Link>

                {(user?.role === ROLES.MANAGER ||
                  user?.role === ROLES.EMPLOYEE) &&
                  user?.branches?.[0] && (
                    <Link
                      to={`/branches/${user.branches[0]}`}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-400">
                        business
                      </span>
                      My Branch
                    </Link>
                  )}

                {/* Head isn't paid through payouts; everyone else sees their payslips. */}
                {user && user.role !== ROLES.HEAD && (
                  <Link
                    to={ROUTES.myPayouts}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-400">
                      payments
                    </span>
                    My Payouts
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => logout()}
                  disabled={isPending}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    logout
                  </span>
                  {isPending ? "Logging out..." : "Log out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
