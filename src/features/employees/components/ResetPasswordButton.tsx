import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { useResetUserPassword } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { ROLES, getAssignableRoles, type Role } from "@/types/auth";

interface ResetPasswordButtonProps {
  /** The User account whose password is being reset. */
  userId?: string;
  userName?: string;
  /** Target's system role — used to keep resets inside the role hierarchy. */
  targetRole?: Role;
  /** `outlined` suits toolbars and action bars; `ghost` is a plain text link. */
  variant?: "outlined" | "ghost";
}

const VARIANT_CLASSES: Record<
  NonNullable<ResetPasswordButtonProps["variant"]>,
  string
> = {
  outlined:
    "rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-on-surface hover:bg-surface-container",
  ghost: "rounded-xl px-3 py-2 text-primary hover:bg-primary/10",
};

/**
 * Password reset for *someone else's* account. Only Head and Admin see it, and
 * only for roles they are allowed to manage (ROLE_HIERARCHY) — the backend
 * re-checks both on every request.
 *
 * Unlike the self-service form on "My Profile", no current password is asked
 * for: the actor doesn't know it. That's what makes this privileged.
 */
const ResetPasswordButton = ({
  userId,
  userName,
  targetRole,
  variant = "outlined",
}: ResetPasswordButtonProps) => {
  const currentUser = useAuthStore((s) => s.user);
  const resetPassword = useResetUserPassword();

  const [isOpen, setIsOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

  const actorRole = currentUser?.role as Role | undefined;

  const isPrivilegedActor =
    actorRole === ROLES.HEAD || actorRole === ROLES.ADMIN;

  // Head may reset an Admin; an Admin may not reset a Head or another Admin.
  const canResetTarget =
    !!actorRole &&
    !!targetRole &&
    getAssignableRoles(actorRole).includes(targetRole);

  if (
    !userId ||
    !isPrivilegedActor ||
    !canResetTarget ||
    currentUser?._id === userId
  ) {
    return null;
  }

  const close = () => {
    setForm({ newPassword: "", confirmPassword: "" });
    setShowPasswords(false);
    setIsOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    await resetPassword.mutateAsync({ userId, newPassword: form.newPassword });
    close();
  };

  const inputClass =
    "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 pr-10 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 font-label-md text-xs font-bold transition-colors self-start sm:self-auto ${VARIANT_CLASSES[variant]}`}
      >
        <span className="material-symbols-outlined text-base">lock_reset</span>
        Reset Password
      </button>

      <Modal
        open={isOpen}
        onClose={close}
        title="Reset Account Password"
        description={`Set a new login password for ${userName || "this user"}.`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="resetNewPassword"
              className="block font-label-md text-xs font-medium text-on-surface-variant"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="resetNewPassword"
                type={showPasswords ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
                className={inputClass}
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">
                  {showPasswords ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <p className="font-body-sm text-[11px] text-on-surface-variant/70">
              Minimum 8 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="resetConfirmPassword"
              className="block font-label-md text-xs font-medium text-on-surface-variant"
            >
              Confirm New Password
            </label>
            <input
              id="resetConfirmPassword"
              type={showPasswords ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className={inputClass}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={close}
              className="rounded-xl px-4 py-2.5 font-label-md text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-base">
                {resetPassword.isPending ? "sync" : "save"}
              </span>
              <span>
                {resetPassword.isPending ? "Updating…" : "Update Password"}
              </span>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ResetPasswordButton;
