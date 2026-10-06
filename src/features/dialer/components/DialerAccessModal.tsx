// src/features/dialer/components/DialerAccessModal.tsx
import React, { useState } from "react";

interface DialerAccessModalProps {
  assignedUserId: string;
  onVerifyAndConnect: (password: string) => void;
  onClose?: () => void;
  isConnecting: boolean;
  error?: string | null;
}

export const DialerAccessModal: React.FC<DialerAccessModalProps> = ({
  assignedUserId,
  onVerifyAndConnect,
  onClose,
  isConnecting,
  error,
}) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onVerifyAndConnect(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-surface-variant/60 hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container-high"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}

        <div className="text-center space-y-1 pr-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">
            Unlock Dialer Access
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant">
            You must first authenticate your VoIP session to access and use the
            dialer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Assigned Stringee User ID
            </label>
            <input
              type="text"
              readOnly
              value={assignedUserId}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs font-mono font-bold text-on-surface cursor-not-allowed opacity-80"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Stringee Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-mono text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 p-2.5 text-center text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting || !password.trim()}
            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-on-primary hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">key</span>
                <span>Authenticate & Access Dialer</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DialerAccessModal;
