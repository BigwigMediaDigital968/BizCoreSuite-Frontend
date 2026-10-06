import { useEmployeeQuery } from "@/features/employees";
import { useChangePassword, useUpdateProfile } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";


const ProfilePage = () => {
    const user = useAuthStore((s) => s.user);

    const { data: userProfile, isLoading: userProfileLoading } = useEmployeeQuery(user?._id);

    const navigate = useNavigate();

    const updateProfile = useUpdateProfile();
    const changePassword = useChangePassword();

    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);

    // Personal info form state — name only. Email is admin-managed and never
    // editable here (changing it would change the account's login identity).
    const [name, setName] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name ?? "");
        }
    }, [userProfile]);

    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await updateProfile.mutateAsync({ name });
        setIsEditing(false);
    };

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match!");
            return;
        }

        await changePassword.mutateAsync({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
        });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordChange(false);
    };

    if (userProfileLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface">
                <div className="flex items-center gap-2 text-on-surface-variant font-body-md">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Loading profile...
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

            {/* 1. Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-5">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 font-label-md text-xs font-bold text-primary hover:underline mb-2"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Dashboard
                    </button>
                    <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
                        My Profile
                    </h1>
                    <p className="font-body-md text-sm text-on-surface-variant">
                        Manage your personal profile information and security settings.
                    </p>
                </div>

                {/* Action Controls */}
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 transition-all self-start sm:self-auto"
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                        <span>Edit Profile</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setName(userProfile?.name ?? "");
                                setIsEditing(false);
                            }}
                            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="my-profile-form"
                            disabled={updateProfile.isPending}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">
                                {updateProfile.isPending ? "sync" : "save"}
                            </span>
                            <span>{updateProfile.isPending ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* 2. Profile Overview Header Card */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-headline-md text-2xl font-extrabold">
                    {userProfile?.name.split(" ").map((n) => n[0]).join("")}
                </div>

                <div className="space-y-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                            {userProfile?.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Active
                        </span>
                    </div>

                    <p className="font-body-md text-sm text-on-surface-variant">
                        {userProfile?.email}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 font-label-sm text-xs">
                        <span className="rounded-lg bg-surface-container-high px-3 py-1 font-bold text-on-surface uppercase tracking-wider">
                            Role: {userProfile?.role}
                        </span>
                        {
                            userProfile?.createdAt && (
                                <span className="text-on-surface-variant/60">
                                    Member since {new Date(userProfile?.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                </span>
                            )
                        }

                    </div>
                </div>
            </div>

            {/* 3. Personal Information Form */}
            <form
                id="my-profile-form"
                onSubmit={handleProfileSubmit}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-8"
            >
                {/* Personal Details */}
                <div className="space-y-4">
                    <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block font-label-md text-xs font-medium text-on-surface-variant">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                disabled={!isEditing}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition-all"
                                required
                                minLength={2}
                            />
                        </div>

                        {/* Email — always read-only; changing login email is admin-managed */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block font-label-md text-xs font-medium text-on-surface-variant">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                disabled
                                value={userProfile?.email ?? ""}
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none disabled:opacity-60 transition-all"
                            />
                            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
                                Contact an admin to change your email address.
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-outline-variant/20" />

                {/* System & Branch Access Info (Read-Only) */}
                {
                    userProfile?.role != 'head' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">storefront</span>
                                    Assigned Operational Branches
                                </h3>
                                <span className="font-label-sm text-[11px] text-on-surface-variant/60 bg-surface-container-high px-2 py-0.5 rounded">
                                    Managed by Admin
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {userProfile?.branches.map((branch: any) => (
                                    <div
                                        key={branch._id}
                                        className="flex items-center gap-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5"
                                    >
                                        <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                                        <span className="font-body-sm text-xs font-bold text-on-surface">
                                            {branch.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
            </form>

            {/* 4. Security / Password — a separate section with its own form and
                save action, independent of the "Edit Profile" flow above. */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">lock</span>
                        Security & Password
                    </h3>

                    {!showPasswordChange && (
                        <button
                            type="button"
                            onClick={() => setShowPasswordChange(true)}
                            className="font-label-md text-xs font-bold text-primary hover:underline"
                        >
                            Change Password
                        </button>
                    )}
                </div>

                {!showPasswordChange ? (
                    <p className="font-body-sm text-xs text-on-surface-variant">
                        ••••••••••••
                    </p>
                ) : (
                    <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-4 bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/30"
                    >
                        <div className="space-y-1.5">
                            <label htmlFor="currentPassword" className="block font-label-md text-xs font-medium text-on-surface-variant">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="newPassword" className="block font-label-md text-xs font-medium text-on-surface-variant">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="block font-label-md text-xs font-medium text-on-surface-variant">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={changePassword.isPending}
                                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">
                                    {changePassword.isPending ? "sync" : "save"}
                                </span>
                                <span>{changePassword.isPending ? "Updating..." : "Update Password"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    setShowPasswordChange(false);
                                }}
                                className="font-label-sm text-xs text-on-surface-variant hover:text-on-surface"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

        </div>
    );
};

export default ProfilePage;