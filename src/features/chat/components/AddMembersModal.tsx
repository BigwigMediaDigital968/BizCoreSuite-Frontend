import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { useBranchesQuery } from "@/features/branches";
import { useAddRoomMembers, useChannelCandidates } from "../hooks/useChat";
import MemberPicker from "./MemberPicker";

interface AddMembersModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  /** People already in the channel; they aren't offered again. */
  memberIds: string[];
}

/** Head / admin: pick more people to bring into an existing channel. */
const AddMembersModal = ({
  open,
  onClose,
  roomId,
  roomName,
  memberIds,
}: AddMembersModalProps) => {
  const {
    data: candidates = [],
    isLoading,
    isError,
    refetch,
  } = useChannelCandidates(open);
  const { data: branches = [] } = useBranchesQuery();
  const addMembers = useAddRoomMembers(roomId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (open) return;
    setSelected(new Set());
    setTried(false);
  }, [open]);

  const people = useMemo(() => {
    const inRoom = new Set(memberIds);
    return candidates.filter((c) => !inRoom.has(c._id));
  }, [candidates, memberIds]);

  const adding = addMembers.isPending;

  const handleAdd = async () => {
    setTried(true);
    if (selected.size === 0) {
      document.getElementById("member-search")?.focus();
      return;
    }
    try {
      const { added } = await addMembers.mutateAsync([...selected]);
      toast.success(
        `Added ${added} ${added === 1 ? "person" : "people"} to #${roomName}`,
      );
      onClose();
    } catch {
      // useAddRoomMembers already shows the reason.
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add members"
      description={`People you add join #${roomName} and are notified.`}
      size="md"
      align="top"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            autoFocus
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            aria-disabled={adding}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 aria-disabled:opacity-70"
          >
            {adding && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {adding
              ? "Adding…"
              : selected.size > 0
                ? `Add ${selected.size} ${selected.size === 1 ? "person" : "people"}`
                : "Add people"}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading people…
        </p>
      ) : isError ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-600">
            Couldn't load the people list.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            Try again
          </button>
        </div>
      ) : people.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Everyone is already in this channel.
        </p>
      ) : (
        <>
          {tried && selected.size === 0 && (
            <p
              role="alert"
              id="add-members-error"
              className="mb-3 text-sm font-medium text-red-600"
            >
              Select at least one person to add.
            </p>
          )}
          <MemberPicker
            people={people}
            branches={branches}
            selected={selected}
            onChange={setSelected}
            invalid={tried && selected.size === 0}
            describedBy={
              tried && selected.size === 0 ? "add-members-error" : undefined
            }
          />
        </>
      )}
    </Modal>
  );
};

export default AddMembersModal;
