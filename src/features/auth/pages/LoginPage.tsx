import { useState, type FormEvent } from "react";
import { useLogin, useSubmitLateReason } from "@/hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");
  const [lockoutData, setLockoutData] = useState<{
    lockoutToken: string;
    message: string;
    reasonRequired: boolean;
  } | null>(null);

  const login = useLogin();
  const submitReason = useSubmitLateReason();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onError: (error: any) => {
          // Detect Express 403 lockout responses (after-hours / holiday)
          const data = error?.response?.data;
          if (data?.lockoutToken) {
            setLockoutData({
              lockoutToken: data.lockoutToken,
              message: data.message,
              reasonRequired: data.reasonRequired,
            });
          }
        },
      },
    );
  };

  const handleReasonSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!lockoutData?.lockoutToken || !reason.trim()) return;

    submitReason.mutate({
      lockoutToken: lockoutData.lockoutToken,
      reason: reason.trim(),
    });
  };

  return (
    <div className="min-h-screen w-full bg-surface grid grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-primary text-on-primary select-none">
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/favicon-1.png"
            className="h-30 w-auto grayscale-100 brightness-0 invert-100"
          />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-4 my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight lg:text-5xl">
            Run your pipeline <br /> with precision.
          </h1>
          <p className="text-lg text-on-primary/80 font-normal leading-relaxed">
            Leads, teams, and performance. all in one place, built for
            high-velocity sales operations.
          </p>
        </div>

        <p className="relative z-10 text-xs text-on-primary/60 font-medium">
          © {new Date().getFullYear()} CRM Inc. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-surface">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-on-surface">
              CRM
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">
              {lockoutData ? "Access Restricted" : "Welcome back"}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {lockoutData
                ? "Special access permission required."
                : "Please enter your details to sign in to your account."}
            </p>
          </div>

          {/* AFTER-HOURS LOCKOUT UI */}
          {lockoutData ? (
            <div className="space-y-6">
              {/* Submission State 1: Request Already Submitted & Waiting */}
              {submitReason.isSuccess || !lockoutData.reasonRequired ? (
                <div className="space-y-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-600">
                    <span className="material-symbols-outlined text-2xl">
                      hourglass_top
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-on-surface">
                    Approval Request Pending
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Your request has been sent to your Head/Manager. Once
                    approved, return here to complete sign in.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLockoutData(null);
                      submitReason.reset();
                    }}
                    className="w-full rounded-xl border border-outline/30 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                /* Submission State 2: Input Form */
                <form onSubmit={handleReasonSubmit} className="space-y-4">
                  <div className="rounded-xl bg-error-container p-4 text-on-error-container text-sm">
                    <p>{lockoutData.message}</p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium text-on-surface"
                    >
                      Reason for Access Request
                    </label>
                    <textarea
                      id="reason"
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why you need access to the CRM right now..."
                      className="w-full rounded-xl border border-outline/30 bg-surface-container-lowest p-3.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitReason.isPending || !reason.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 font-semibold text-on-primary shadow-sm transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitReason.isPending ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-xl">
                          progress_activity
                        </span>
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      "Submit Reason for Approval"
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* STANDARD LOGIN FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {login.isError && !lockoutData && (
                <div className="flex items-center gap-3 rounded-xl bg-error-container p-4 text-on-error-container text-sm">
                  <span className="material-symbols-outlined shrink-0 text-xl">
                    error
                  </span>
                  <p>
                    Invalid email or password. Please check your credentials.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-on-surface"
                >
                  Email address
                </label>
                <div className="relative flex items-center rounded-xl border border-outline/30 bg-surface-container-lowest transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="material-symbols-outlined absolute left-3.5 text-xl text-on-surface-variant/70">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-on-surface"
                  >
                    Password
                  </label>
                  {/* <a
                    href="#"
                    className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </a> */}
                </div>
                <div className="relative flex items-center rounded-xl border border-outline/30 bg-surface-container-lowest transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="material-symbols-outlined absolute left-3.5 text-xl text-on-surface-variant/70">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent py-3 pl-11 pr-11 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 text-on-surface-variant/70 hover:text-on-surface focus:outline-none transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 font-semibold text-on-primary shadow-sm transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {login.isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">
                      progress_activity
                    </span>
                    <span>Signing in…</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
