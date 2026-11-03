import type { AccessSectionProps } from "@/features/employees/access/accessSections";
import { useUpdateUserChatSettings, useUserChatSettings } from "../hooks/useChat";

/**
 * Chat access for one person. For now that is the direct-message switch;
 * channel access will be added here later.
 */
const ChatAccessSection = ({ userId, userName }: AccessSectionProps) => {
  const settings = useUserChatSettings(userId);
  const updateSettings = useUpdateUserChatSettings(userId);

  const dmOn = settings.data?.canDirectMessage ?? true;

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <h4 id="access-dm-label" className="text-sm font-bold text-on-surface">
          Direct messages
        </h4>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          One-to-one chat works only when both people have it on. Turning it
          off keeps {userName}'s existing conversations readable, but nobody
          can send new messages in them.
        </p>
        {settings.isError && (
          <p className="mt-1 text-xs text-error">
            Couldn't load this setting.{" "}
            <button
              type="button"
              onClick={() => settings.refetch()}
              className="font-bold underline"
            >
              Try again
            </button>
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={dmOn}
        aria-labelledby="access-dm-label"
        disabled={
          settings.isLoading || settings.isError || updateSettings.isPending
        }
        onClick={() => updateSettings.mutate(!dmOn)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 ${
          dmOn ? "bg-primary" : "bg-outline-variant"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            dmOn ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

export default ChatAccessSection;
