import { Link, useNavigate, useParams } from "react-router";
import { useContestId } from "../hooks/useContests";
import ContestForm from "../components/ContestForm";


export const ContestFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // Fetch existing contest data only when in Edit Mode
    const { data: contest, isLoading, isError } = useContestId(id??"");

    const handleSuccess = () => {
        if (isEditMode && id) {
            navigate(`/contest/${id}`);
        } else {
            navigate("/contests");
        }
    };

    const handleCancel = () => {
        if (isEditMode && id) {
            navigate(`/contest/${id}`);
        } else {
            navigate("/contests");
        }
    };

    if (isEditMode && isLoading) {
        return (
            <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="h-4 w-32 bg-surface-container-high rounded-md" />
                <div className="h-8 w-64 bg-surface-container-high rounded-xl" />
                <div className="h-96 w-full bg-surface-container-high rounded-2xl" />
            </div>
        );
    }

    if (isEditMode && (isError || !contest)) {
        return (
            <div className="min-h-screen bg-surface p-8 text-center space-y-4 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-error">error</span>
                <h2 className="text-lg font-bold text-on-surface">Contest Not Found</h2>
                <p className="text-xs text-on-surface-variant max-w-sm">
                    The contest you are trying to edit does not exist or has been removed.
                </p>
                <Link
                    to="/contests"
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary"
                >
                    Back to Contests
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div>
                    <Link
                        to={isEditMode && id ? `/contest/${id}` : "/contests"}
                        className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors mb-2"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        {isEditMode ? "Back to Contest Details" : "Back to Contests List"}
                    </Link>

                    <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1">
                        <span className="h-0.5 w-4 bg-primary rounded-full" />
                        <span>Engagement</span>
                    </div>

                    <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                        {isEditMode ? `Edit "${contest?.title}"` : "Create New Contest"}
                    </h1>
                    <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
                        {isEditMode
                            ? "Update contest rules, target branches, and schedule timelines."
                            : "Launch and configure sales contests across participating branches."}
                    </p>
                </div>

                {/* Form Wrapper Card */}
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
                    <ContestForm
                        contest={isEditMode ? contest : null}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>

            </div>
        </div>
    );
};

export default ContestFormPage;