import { useUpdateUserChatSettings, useUserChatSettings } from "../hooks/useChat";

interface DirectMessageToggleProps {
  userId: string;
}

/**
 * Head/admin switch for whether a user can send and receive direct messages.
 * Render inside a `chat:manage` permission check.
 */
const DirectMessageToggle = ({ userId }: DirectMessageToggleProps) => {
  const { data, isLoading, isError } = useUserChatSettings(userId);
  const update = useUpdateUserChatSettings(userId);

  const enabled = data?.canDirectMessage ?? true;
  const busy = isLoading || update.isPending;

  // Don't offer a switch we couldn't read the state of.
  if (!userId || isError || (!data && !isLoading)) return null;

  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface"
      title={
        enabled
          ? "Turning this off makes this person's existing direct messages read-only"
          : "This person can't send or receive direct messages"
      }
    >
      <span>Direct messages</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Can send direct messages"
        disabled={busy}
        onClick={() => update.mutate(!enabled)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          enabled ? "bg-primary" : "bg-outline-variant"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
};

export default DirectMessageToggle;
