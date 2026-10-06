import { useNavigate } from "react-router";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Visual Badge & Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-error/10 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-error/30 bg-surface-container-lowest shadow-md text-error">
            <span className="material-symbols-outlined text-5xl">
              lock_person
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <span className="font-label-sm text-xs font-bold uppercase tracking-widest text-error bg-error/10 px-3 py-1 rounded-full">
            Access Restricted (403)
          </span>
          <h1 className="font-headline-md text-3xl sm:text-4xl font-extrabold text-on-surface">
            Unauthorized Access
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto">
            You don't have the necessary system permissions or branch assignments to access this CRM page.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-label-md text-xs font-bold text-on-primary hover:bg-primary/90 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>My Dashboard</span>
          </button>
        </div>

        {/* Permission Info Card */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left shadow-sm space-y-2.5 mt-6">
          <div className="flex items-center gap-2 text-on-surface font-label-md text-xs font-bold">
            <span className="material-symbols-outlined text-lg text-amber-600">
              shield_lock
            </span>
            <span>Required Role or Branch Access</span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant/70">
            If you need access to this resource, please reach out to your Administrator or HR Manager to update your assigned role or branch access scope.
          </p>
        </div>

      </div>
    </div>
  );
};

export default UnauthorizedPage;