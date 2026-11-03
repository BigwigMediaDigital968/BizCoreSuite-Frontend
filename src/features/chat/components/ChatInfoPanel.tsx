import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronRight,
  Hash,
  Lock,
  LogOut,
  Search,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ChatRoom } from "@/types/chat";
import type { RoomPerson } from "../api/chatApi";
import {
  useLeaveRoom,
  useRemoveRoomMember,
  useRoomInfo,
} from "../hooks/useChat";
import { initials, roleLabel, roomTitle } from "../utils/format";
import AddMembersModal from "./AddMembersModal";

interface ChatInfoPanelProps {
  room: ChatRoom;
  currentUserId?: string;
  /** Head / admin: can add and remove members. */
  canManage: boolean;
  /** Can open an employee's profile page. */
  canViewProfiles: boolean;
  onClose: () => void;
  /** After leaving, so the page can move off the room. */
  onLeft: () => void;
  /** Docked beside the chat (opens in place) vs a full-screen drawer (slides in). */
  isDesktop: boolean;
}

// Drawer curve: fast out of the gate, long soft landing.
const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;
const ENTER = { duration: 0.28, ease: DRAWER_EASE };
const EXIT = { duration: 0.2, ease: DRAWER_EASE };

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const Section = ({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) => (
  <section aria-label={label} className="mt-2 bg-white px-5 py-4">
    {children}
  </section>
);

/** Shared files will show here; for now the section just holds its place. */
const SharedMedia = () => (
  <Section label="Media, links and docs">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-slate-800">
        Media, links and docs
      </h3>
      <span className="flex items-center gap-1 text-xs text-slate-500">
        0 <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
    <p className="mt-2 text-xs text-slate-500">Nothing shared yet.</p>
  </Section>
);

/**
 * Profile of the open conversation, like WhatsApp's contact / group info:
 * who it is, shared media (a placeholder for now), and the actions that
 * belong to it. A DM shows the person; a channel shows its members and
 * lets you leave.
 */
const ChatInfoPanel = ({
  room,
  currentUserId,
  canManage,
  canViewProfiles,
  onClose,
  onLeft,
  isDesktop,
}: ChatInfoPanelProps) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const leave = useLeaveRoom();
  // Once you've left, the panel lingers for its exit animation; don't ask the
  // server about a room you're no longer in (it would answer 404).
  const {
    data: info,
    isLoading,
    isError,
    refetch,
  } = useRoomInfo(leave.isPending || leave.isSuccess ? null : room._id);
  const removeMember = useRemoveRoomMember(room._id);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removing, setRemoving] = useState<RoomPerson | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // Two screens: the profile, and the full member list one tap deeper.
  const [view, setView] = useState<"info" | "members">("info");
  const [memberSearch, setMemberSearch] = useState("");

  // Escape steps back (members -> profile -> closed). A dialog opened from
  // here handles its own Escape first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || confirmLeave || removing || addOpen) return;
      if (view === "members") setView("info");
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, confirmLeave, removing, addOpen, view]);

  // After switching screens, put focus on that screen's header button so
  // keyboard and screen-reader users land at the top of the new screen.
  const headerButtonRef = useRef<HTMLButtonElement>(null);
  const firstViewRender = useRef(true);
  useEffect(() => {
    if (firstViewRender.current) {
      firstViewRender.current = false;
      return;
    }
    headerButtonRef.current?.focus();
  }, [view]);

  const isDirect = room.type === "DIRECT";

  // Show what the list already knows straight away; the fetch adds branches.
  const people: RoomPerson[] = useMemo(
    () =>
      info?.participants ??
      room.participants.map((p) => ({ ...p, isActive: true, branches: [] })),
    [info, room.participants],
  );
  const other = isDirect
    ? people.find((p) => p._id !== currentUserId)
    : undefined;
  const creator = people.find(
    (p) => p._id === (info?.createdBy ?? room.createdBy),
  );

  const title = roomTitle(room);
  // Matches the md:w-80 / lg:w-96 the content is laid out at.
  const panelWidth = useMemo(() => (window.innerWidth >= 1024 ? 384 : 320), []);

  const handleLeave = async () => {
    try {
      await leave.mutateAsync(room._id);
      setConfirmLeave(false);
      toast.success(`You left #${title}`);
      onLeft();
    } catch {
      // useLeaveRoom already shows the reason.
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await removeMember.mutateAsync(removing._id);
      toast.success(`${removing.name} was removed from #${title}`);
      setRemoving(null);
    } catch {
      // useRemoveRoomMember already shows the reason.
    }
  };

  // The full member list (second screen): search, add, and the people.
  const q = memberSearch.trim().toLowerCase();
  const shownPeople = q
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          roleLabel(p.role).toLowerCase().includes(q),
      )
    : people;

  const membersScreen = (
    <>
      {canManage && (
        <Section label="Add members">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium text-purple-700 hover:bg-purple-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100"
            >
              <UserPlus className="h-4 w-4" />
            </span>
            Add members
          </button>
        </Section>
      )}

      <Section label="Members">
        {people.length > 6 && (
          <div className="relative mb-2">
            <label htmlFor="member-list-search" className="sr-only">
              Search members
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            />
            <input
              id="member-list-search"
              type="search"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members"
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            />
          </div>
        )}

        {shownPeople.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No one matches “{memberSearch.trim()}”.
          </p>
        ) : (
          <ul className="-mx-2 divide-y divide-slate-100">
            {shownPeople.map((p) => {
              const isMe = p._id === currentUserId;
              const isCreator = p._id === (info?.createdBy ?? room.createdBy);
              return (
                <li key={p._id} className="flex items-center gap-3 px-2 py-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
                  >
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">
                        {p.name}
                        {isMe && (
                          <span className="font-normal text-slate-500">
                            {" "}
                            (You)
                          </span>
                        )}
                      </span>
                      {isCreator && (
                        <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                          Creator
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {roleLabel(p.role)}
                    </span>
                  </span>
                  {canManage && !isMe && (
                    <button
                      type="button"
                      onClick={() => setRemoving(p)}
                      aria-label={`Remove ${p.name} from the channel`}
                      title="Remove"
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );

  return (
    <motion.aside
      aria-label={isDirect ? "Contact info" : "Channel info"}
      className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-hidden bg-slate-50 md:static md:inset-auto md:z-auto md:shrink-0 md:border-l md:border-slate-200"
      {...(isDesktop
        ? {
            // Docked column: open it in place. Width is the one thing that
            // has to animate here, since the chat beside it resizes with it.
            initial: { width: 0 },
            animate: { width: panelWidth, transition: ENTER },
            exit: { width: 0, transition: EXIT },
          }
        : reduceMotion
          ? {
              // Reduced motion: fade instead of sliding across the screen.
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { duration: 0.15 } },
              exit: { opacity: 0, transition: { duration: 0.1 } },
            }
          : {
              // Full-screen drawer: slide from the edge it will leave through.
              initial: { transform: "translateX(100%)" },
              animate: { transform: "translateX(0%)", transition: ENTER },
              exit: { transform: "translateX(100%)", transition: EXIT },
            })}
    >
      {/* Fixed width inside, so the content doesn’t reflow while the column opens. */}
      <div className="flex min-h-0 w-full flex-1 flex-col md:w-80 lg:w-96">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <button
            ref={headerButtonRef}
            type="button"
            onClick={view === "members" ? () => setView("info") : onClose}
            aria-label={
              view === "members" ? "Back to channel info" : "Close info"
            }
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {view === "members" ? (
              <ArrowLeft className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </button>
          <h2 className="font-semibold text-slate-800">
            {view === "members"
              ? `Members · ${people.length}`
              : isDirect
                ? "Contact info"
                : "Channel info"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {view === "members" ? (
            membersScreen
          ) : (
            <>
              {/* Who this is */}
              <section className="bg-white px-5 pb-5 pt-6 text-center">
                {isDirect ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-purple-100 text-2xl font-semibold text-purple-700"
                    >
                      {initials(other?.name ?? room.otherUser?.name)}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {roleLabel(other?.role ?? room.otherUser?.role)}
                    </p>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-purple-100 text-purple-700"
                    >
                      <Hash className="h-10 w-10" />
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      #{title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Channel · {people.length}{" "}
                      {people.length === 1 ? "member" : "members"}
                    </p>
                    {(creator || info?.createdAt || room.createdAt) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {creator
                          ? `Created by ${creator._id === currentUserId ? "you" : creator.name}`
                          : "Created"}
                        {` on ${formatDate(info?.createdAt ?? room.createdAt)}`}
                      </p>
                    )}
                    {info?.branch && (
                      <p className="mt-1 text-xs text-slate-500">
                        Branch: {info.branch.name}
                      </p>
                    )}
                  </>
                )}
              </section>

              {isError && (
                <Section>
                  <p className="text-sm text-slate-600">
                    Couldn't load all the details.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-1 rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    Try again
                  </button>
                </Section>
              )}

              {/* DM: details about the person */}
              {isDirect && other && (
                <Section label="About">
                  <h3 className="text-sm font-medium text-slate-800">About</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Email</dt>
                      <dd className="break-all text-slate-800">
                        {other.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Role</dt>
                      <dd className="text-slate-800">
                        {roleLabel(other.role)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Branches</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {isLoading ? (
                          <span className="text-slate-400">Loading…</span>
                        ) : other.branches.length === 0 ? (
                          <span className="text-slate-500">None</span>
                        ) : (
                          other.branches.map((b) => (
                            <span
                              key={b._id}
                              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                            >
                              {b.name}
                            </span>
                          ))
                        )}
                      </dd>
                    </div>
                  </dl>
                  {canViewProfiles && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/employees/${other._id}/profile`)
                      }
                      className="mt-4 rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      View employee profile
                    </button>
                  )}
                </Section>
              )}

              {isDirect && room.readOnly && (
                <Section>
                  <p className="flex items-start gap-2 text-sm text-amber-800">
                    <Lock
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    Direct messages are turned off for this conversation. You
                    can still read past messages.
                  </p>
                </Section>
              )}

              <SharedMedia />

              {/* Channel: only the count here; the list is one tap away. */}
              {!isDirect && (
                <Section label="Members">
                  <button
                    type="button"
                    onClick={() => setView("members")}
                    aria-label={`View ${people.length} ${people.length === 1 ? "member" : "members"}`}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-1 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      Members
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      {people.length}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>
                </Section>
              )}

              {/* Channel: leave */}
              {!isDirect && (
                <Section label="Actions">
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(true)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Leave channel
                  </button>
                </Section>
              )}
            </>
          )}
        </div>

        <ConfirmDialog
          open={confirmLeave}
          title={`Leave #${title}?`}
          description="You'll stop receiving its messages, and can only rejoin if an admin adds you back."
          confirmLabel="Leave channel"
          tone="danger"
          isLoading={leave.isPending}
          onConfirm={handleLeave}
          onClose={() => setConfirmLeave(false)}
        />
        <ConfirmDialog
          open={!!removing}
          title={
            removing
              ? `Remove ${removing.name} from #${title}?`
              : "Remove member?"
          }
          description="They'll lose access to the channel and its history."
          confirmLabel="Remove"
          tone="danger"
          isLoading={removeMember.isPending}
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        />
        <AddMembersModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          roomId={room._id}
          roomName={title}
          memberIds={people.map((p) => p._id)}
        />
      </div>
    </motion.aside>
  );
};

export default ChatInfoPanel;
