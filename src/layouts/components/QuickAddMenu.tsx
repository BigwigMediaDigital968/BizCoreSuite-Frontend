import { Can } from "@/components/Auth/Can";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

interface QuickAddProps {
  // Optional callbacks if you want to open modals directly instead of navigating
  onAddLead?: () => void;
  onAddBranch?: () => void;
  onAddEmployee?: () => void;
}

const QuickAddMenu = ({
  onAddLead,
  onAddBranch,
  onAddEmployee,
}: QuickAddProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (actionType: "lead" | "branch" | "employee") => {
    setIsOpen(false);

    switch (actionType) {
      case "lead":
        if (onAddLead) onAddLead();
        else navigate("/leads?new");
        break;
      case "branch":
        if (onAddBranch) onAddBranch();
        else navigate("/branches/new");
        break;
      case "employee":
        if (onAddEmployee) onAddEmployee();
        else navigate("/employees/onboard");
        break;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen((prev) => !prev)}
        className="hidden items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-on-primary shadow-sm hover:bg-primary/90 transition-all active:scale-95 sm:flex"
      >
        <span
          className={`material-symbols-outlined text-lg transition-transform duration-200 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          add
        </span>
        <span>Quick Add</span>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50"
        >
          <div className="px-3 py-2 border-b border-outline-variant/20">
            <p className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Quick Management Actions
            </p>
          </div>

          <div className="mt-1 space-y-1">
            {/* Lead Option */}
            <Can permission={"lead:create"}>
              <button
                onClick={() => handleAction("lead")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    person_add
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">New Lead</p>
                  <p className="text-[11px] text-on-surface-variant/70">
                    Add client or inquiry record
                  </p>
                </div>
              </button>
            </Can>
            {/* Employee Option */}
            <Can permission={"user:create"}>
              <button
                onClick={() => handleAction("employee")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    badge
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">New Employee</p>
                  <p className="text-[11px] text-on-surface-variant/70">
                    Onboard workforce member
                  </p>
                </div>
              </button>
            </Can>
            <Can permission={"branch:create"}>
              {/* Branch Option */}
              <button
                onClick={() => handleAction("branch")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    storefront
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">New Branch</p>
                  <p className="text-[11px] text-on-surface-variant/70">
                    Create operational location
                  </p>
                </div>
              </button>
            </Can>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAddMenu;
