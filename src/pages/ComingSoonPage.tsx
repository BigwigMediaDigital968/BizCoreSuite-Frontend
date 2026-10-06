import { useNavigate } from "react-router";

interface ComingSoonProps {
  featureName?: string;
  estimatedRelease?: string;
}

const ComingSoonPage = ({
  featureName = "Advanced CRM Analytics",
}: ComingSoonProps) => {
  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Visual Badge & Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-md text-primary">
            <span className="material-symbols-outlined text-5xl">
              rocket_launch
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 font-label-sm text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            Feature In Development
          </span>
          <h1 className="font-headline-md text-3xl sm:text-4xl font-extrabold text-on-surface">
            {featureName}
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto">
            We are actively building this module to give you deeper operational insights. Check back soon!
          </p>
        </div>

        

        

        {/* Back Navigation */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Safety</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ComingSoonPage;