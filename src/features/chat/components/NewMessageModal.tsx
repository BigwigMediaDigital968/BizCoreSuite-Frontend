import { useState } from "react";
import { Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ChatRoom } from "@/types/chat";
import { useChatUsers, useOpenDirectRoom } from "../hooks/useChat";
import { initials, roleLabel } from "../utils/format";

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
  onOpened: (room: ChatRoom) => void;
}

const NewMessageModal = ({ open, onClose, onOpened }: NewMessageModalProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data, isLoading, isError } = useChatUsers(debouncedSearch, open);
  const openRoom = useOpenDirectRoom();

  const users = data?.users ?? [];
  const dmDisabled = data?.canDirectMessage === false;

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const startChat = async (userId: string) => {
    try {
      const room = await openRoom.mutateAsync(userId);
      onOpened(room);
      handleClose();
    } catch {
      // useOpenDirectRoom already shows the reason.
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New message"
      description="Start a one-to-one conversation."
      size="sm"
    >
      {dmDisabled ? (
        <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
          Direct messages are turned off for your account. Ask your head or
          admin to turn them on.
        </p>
      ) : (
        <div className="space-y-3">
          <label htmlFor="dm-search" className="sr-only">
            Search people
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="dm-search"
              type="search"
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto -mx-1">
            {isLoading ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">
                Loading people…
              </p>
            ) : isError ? (
              <p className="px-2 py-6 text-center text-sm text-slate-500">
                Couldn't load people. Close this and try again.
              </p>
            ) : users.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-500">
                {debouncedSearch
                  ? `No one matches "${debouncedSearch}".`
                  : "No one is available to message yet."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {users.map((u) => (
                  <li key={u._id}>
                    <button
                      type="button"
                      onClick={() => startChat(u._id)}
                      disabled={openRoom.isPending}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                        {initials(u.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {u.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {roleLabel(u.role)} · {u.email}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NewMessageModal;
