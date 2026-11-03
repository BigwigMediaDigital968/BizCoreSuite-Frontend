import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { useBranchesQuery } from "@/features/branches";
import type { ChatRoom } from "@/types/chat";
import type { ChannelType } from "../api/chatApi";
import { useCreateChannel } from "../hooks/useChat";

const MAX_NAME_LENGTH = 60;

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: ChatRoom) => void;
}

const TYPE_OPTIONS: { value: ChannelType; label: string; hint: string }[] = [
  { value: "GLOBAL", label: "Company-wide", hint: "Visible to everyone" },
  { value: "BRANCH", label: "Branch", hint: "Visible to one branch's team" },
];

const CreateChannelModal = ({
  open,
  onClose,
  onCreated,
}: CreateChannelModalProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("GLOBAL");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");

  const { data: branches = [], isLoading: branchesLoading } =
    useBranchesQuery();
  const createChannel = useCreateChannel();

  const reset = () => {
    setName("");
    setType("GLOBAL");
    setBranchId("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a channel name");
    if (type === "BRANCH" && !branchId) return setError("Choose a branch");
    setError("");

    try {
      const room = await createChannel.mutateAsync({
        name: trimmed,
        type,
        ...(type === "BRANCH" ? { branchId } : {}),
      });
      onCreated(room);
      handleClose();
    } catch {
      // useCreateChannel already toasts the server's message; keep the
      // modal open so the name can be corrected.
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create channel"
      description="Channels are shared spaces for a team. For one-to-one chats, use a direct message."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="channel-name"
            className="text-sm font-medium text-slate-700"
          >
            Channel name
          </label>
          <input
            id="channel-name"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. announcements"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium text-slate-700">Who can join</legend>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                  type === option.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="channel-type"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                  className="sr-only"
                />
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs opacity-80">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {type === "BRANCH" && (
          <div className="space-y-1.5">
            <label
              htmlFor="channel-branch"
              className="text-sm font-medium text-slate-700"
            >
              Branch
            </label>
            <select
              id="channel-branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={branchesLoading}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">
                {branchesLoading ? "Loading branches…" : "Select a branch"}
              </option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createChannel.isPending}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {createChannel.isPending ? "Creating…" : "Create channel"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateChannelModal;
