import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Building2, GitBranch, Loader2, Users, type LucideIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Stepper from "@/components/ui/Stepper";
import { useAuth } from "@/hooks/useAuth";
import { useBranchesQuery } from "@/features/branches";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { ChatRoom } from "@/types/chat";
import { useChannelCandidates, useCreateChannel } from "../hooks/useChat";
import MemberPicker from "./MemberPicker";

const MAX_NAME_LENGTH = 60;
const MAX_REVIEW_NAMES = 6;
// The submit button lives in the dialog footer, outside the <form>.
const FORM_ID = "create-channel-form";

const STEPS = ["Name", "Members", "Review"] as const;
const LAST_STEP = STEPS.length - 1;

type Audience = "company" | "branch" | "custom";

const AUDIENCES: { value: Audience; label: string; icon: LucideIcon }[] = [
  { value: "company", label: "Whole company", icon: Building2 },
  { value: "branch", label: "One branch", icon: GitBranch },
  { value: "custom", label: "Selected people", icon: Users },
];

const fieldClass = (invalid: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 ${
    invalid
      ? "border-red-400 focus-visible:ring-red-500"
      : "border-slate-300 focus-visible:ring-purple-500"
  }`;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: ChatRoom) => void;
}

const CreateChannelModal = ({ open, onClose, onCreated }: CreateChannelModalProps) => {
  const { user } = useAuth();

  const { data: candidates = [], isLoading, isError, refetch } = useChannelCandidates(open);
  const { data: branches = [] } = useBranchesQuery();
  const createChannel = useCreateChannel();

  // You're added automatically, so you aren't in the list.
  const people = useMemo(
    () => candidates.filter((c) => c._id !== user?._id),
    [candidates, user?._id]
  );
  const activeBranches = useMemo(() => branches.filter((b) => b.isActive), [branches]);
  const branchSize = useCallback(
    (id: string) => people.filter((p) => p.branches.some((b) => b._id === id)).length,
    [people]
  );

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<Audience>("company");
  const [branchId, setBranchId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState({ name: false, branch: false });
  // Which steps the user has tried to leave, so errors show only after that.
  const [tried, setTried] = useState({ name: false, members: false });
  const [nameServerError, setNameServerError] = useState("");
  const [edited, setEdited] = useState(false);
  // Closing with input shows this prompt in place of the buttons, rather than
  // opening a second dialog on top of this one.
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  /** Who a given audience starts with. */
  const startingMembers = useCallback(
    (kind: Audience, branch: string) => {
      if (kind === "company") return new Set(people.map((p) => p._id));
      if (kind === "branch" && branch) {
        return new Set(
          people.filter((p) => p.branches.some((b) => b._id === branch)).map((p) => p._id)
        );
      }
      return new Set<string>();
    },
    [people]
  );

  // "Whole company" is the default, so seed it once the people have loaded.
  const seeded = useRef(false);
  useEffect(() => {
    if (!open || seeded.current || people.length === 0) return;
    seeded.current = true;
    setSelected(startingMembers("company", ""));
  }, [open, people, startingMembers]);

  // Start fresh every time the dialog is closed.
  useEffect(() => {
    if (open) return;
    seeded.current = false;
    setStep(0);
    setName("");
    setAudience("company");
    setBranchId("");
    setSelected(new Set());
    setTouched({ name: false, branch: false });
    setTried({ name: false, members: false });
    setNameServerError("");
    setEdited(false);
    setConfirmDiscard(false);
  }, [open]);

  // Moving between steps: announce the new step by moving focus to its
  // heading, or to a field that needs attention.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusAfterStep = useRef<string | null>(null);
  const firstStepRender = useRef(true);
  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    const target = focusAfterStep.current && document.getElementById(focusAfterStep.current);
    focusAfterStep.current = null;
    (target || headingRef.current)?.focus();
  }, [step]);

  const chooseAudience = (next: Audience) => {
    setAudience(next);
    setSelected(startingMembers(next, next === "branch" ? branchId : ""));
  };

  const chooseBranch = (id: string) => {
    setBranchId(id);
    setSelected(startingMembers("branch", id));
  };

  // --- validation (blur-first; errors clear as soon as the user engages) ---
  const nameError = !name.trim() ? "Enter a channel name, like “announcements”." : "";
  const branchError = audience === "branch" && !branchId ? "Choose a branch." : "";
  const membersError =
    selected.size === 0 ? "Add at least one person besides yourself." : "";

  const showNameError = (touched.name || tried.name) && (nameError || nameServerError);
  const showBranchError = (touched.branch || tried.members) && branchError;
  // With no branch chosen yet the list isn't shown, so that error comes first.
  const showMembersError = tried.members && !branchError && membersError;

  const dirty = edited || name.trim().length > 0;

  /** Escape, the X and the backdrop all land here. */
  const requestClose = () => {
    if (createChannel.isPending) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const goTo = (next: number, focusId?: string) => {
    focusAfterStep.current = focusId ?? null;
    setStep(next);
  };

  const handleNext = () => {
    // Next is never disabled: a failed step shows its problems and focuses
    // the first one.
    if (step === 0) {
      setTried((t) => ({ ...t, name: true }));
      if (nameError) return document.getElementById("channel-name")?.focus();
    }
    if (step === 1) {
      setTried((t) => ({ ...t, members: true }));
      if (branchError) return document.getElementById("channel-branch")?.focus();
      if (membersError) return document.getElementById("member-search")?.focus();
    }
    goTo(step + 1);
  };

  const handleCreate = async () => {
    try {
      const room = await createChannel.mutateAsync({
        name: name.trim(),
        type: audience === "branch" ? "BRANCH" : "GLOBAL",
        ...(audience === "branch" ? { branchId } : {}),
        participants: [...selected],
      });
      toast.success(`Channel “${room.name ?? name.trim()}” created`);
      onCreated(room);
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        // The name belongs to step 1, so take the user back to it.
        setNameServerError("A channel with this name already exists. Try another name.");
        goTo(0, "channel-name");
        return;
      }
      toast.error(getErrorMessage(error, "Couldn't create the channel. Try again."));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (createChannel.isPending) return;
    if (step < LAST_STEP) handleNext();
    else handleCreate();
  };

  const creating = createChannel.isPending;
  const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label ?? "";
  const branchName = activeBranches.find((b) => b._id === branchId)?.name;
  const selectedNames = useMemo(
    () => people.filter((p) => selected.has(p._id)).map((p) => p.name),
    [people, selected]
  );

  const footer = confirmDiscard ? (
    <div
      role="alertdialog"
      aria-label="Discard this channel?"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm font-medium text-slate-800">
        {name.trim() ? `Discard channel “${name.trim()}”?` : "Discard this new channel?"}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={() => setConfirmDiscard(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          Keep editing
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          Discard channel
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={step === 0 ? requestClose : () => goTo(step - 1)}
        disabled={creating}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50"
      >
        {step === 0 ? "Cancel" : "Back"}
      </button>
      <button
        type="submit"
        form={FORM_ID}
        aria-disabled={creating}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 aria-disabled:opacity-70"
      >
        {creating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {step < LAST_STEP ? "Next" : creating ? "Creating…" : "Create channel"}
      </button>
    </div>
  );

  const stepHeading = (title: string, hint: string) => (
    <div className="mb-5">
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="text-base font-semibold text-slate-900 focus:outline-none"
      >
        {title}
      </h3>
      <p className="mt-0.5 text-sm text-slate-600">{hint}</p>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title="New channel"
      description="A shared space for a team. For a one-to-one chat, send a direct message."
      size="md"
      align="top"
      footer={footer}
    >
      <Stepper steps={[...STEPS]} current={step} onStepClick={(i) => goTo(i)} />

      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="mt-6">
        {/* ---------------- Step 1: name ---------------- */}
        {step === 0 && (
          <div>
            {stepHeading("Name your channel", "Next, you'll choose who joins.")}

            <label htmlFor="channel-name" className="mb-1.5 block text-sm font-medium text-slate-800">
              Channel name <span className="text-red-600">*</span>
            </label>
            <input
              id="channel-name"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              autoFocus
              required
              aria-required="true"
              aria-invalid={showNameError ? true : undefined}
              aria-describedby={showNameError ? "channel-name-error" : "channel-name-hint"}
              onChange={(e) => {
                setName(e.target.value);
                setNameServerError("");
              }}
              onFocus={() => setNameServerError("")}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="announcements"
              className={fieldClass(!!showNameError)}
            />
            {showNameError ? (
              <p id="channel-name-error" role="alert" className="mt-1.5 text-sm text-red-600">
                {nameError || nameServerError}
              </p>
            ) : (
              <p id="channel-name-hint" className="mt-1.5 flex justify-between text-xs text-slate-500">
                <span>Pick something short. Channels can't be renamed yet.</span>
                <span aria-hidden="true">
                  {name.length}/{MAX_NAME_LENGTH}
                </span>
              </p>
            )}
          </div>
        )}

        {/* ---------------- Step 2: who joins ---------------- */}
        {step === 1 && (
          <div className="space-y-6">
            {stepHeading(
              "Choose who joins",
              "Start from a group, then add or remove anyone below."
            )}

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-800">
                Who starts in this channel
              </legend>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {AUDIENCES.map((option, i) => {
                  const Icon = option.icon;
                  const hint =
                    option.value === "company"
                      ? `Everyone starts as a member (${plural(people.length, "person", "people")}).`
                      : option.value === "branch"
                        ? "Starts with that branch's team."
                        : "Starts empty. You choose who joins.";
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50 has-[:checked]:bg-purple-50/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-purple-500 ${
                        i > 0 ? "border-t border-slate-100" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="audience"
                        value={option.value}
                        checked={audience === option.value}
                        onChange={() => {
                          chooseAudience(option.value);
                          setEdited(true);
                        }}
                        className="h-4 w-4 shrink-0 accent-purple-600 focus:outline-none"
                      />
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-slate-800">
                          {option.label}
                        </span>
                        <span className="block text-xs text-slate-500">{hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                You're added automatically. Changing this resets the list below.
              </p>
            </fieldset>

            {audience === "branch" && (
              <div>
                <label htmlFor="channel-branch" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Branch <span className="text-red-600">*</span>
                </label>
                <select
                  id="channel-branch"
                  value={branchId}
                  required
                  aria-required="true"
                  aria-invalid={showBranchError ? true : undefined}
                  aria-describedby={showBranchError ? "channel-branch-error" : undefined}
                  onChange={(e) => {
                    chooseBranch(e.target.value);
                    setEdited(true);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, branch: true }))}
                  className={fieldClass(!!showBranchError)}
                >
                  <option value="">Select a branch</option>
                  {activeBranches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({plural(branchSize(b._id), "person", "people")})
                    </option>
                  ))}
                </select>
                {showBranchError && (
                  <p id="channel-branch-error" role="alert" className="mt-1.5 text-sm text-red-600">
                    {branchError}
                  </p>
                )}
              </div>
            )}

            <section aria-labelledby="members-heading">
              <h4 id="members-heading" className="mb-1 text-sm font-medium text-slate-800">
                Members <span className="text-red-600">*</span>
              </h4>
              {showMembersError && (
                <p id="members-error" role="alert" className="mb-3 text-sm font-medium text-red-600">
                  {membersError}
                </p>
              )}
              {audience === "branch" && !branchId ? (
                <Placeholder>Choose a branch to see its team.</Placeholder>
              ) : isLoading ? (
                <Placeholder>Loading people…</Placeholder>
              ) : isError ? (
                <Placeholder>
                  <span>Couldn't load the people list.</span>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-2 block w-full rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    Try again
                  </button>
                </Placeholder>
              ) : (
                <MemberPicker
                  people={people}
                  branches={branches}
                  selected={selected}
                  presetBranchId={audience === "branch" ? branchId : ""}
                  onChange={(next) => {
                    setSelected(next);
                    setEdited(true);
                  }}
                  invalid={!!showMembersError}
                  describedBy={showMembersError ? "members-error" : undefined}
                />
              )}
            </section>
          </div>
        )}

        {/* ---------------- Step 3: review ---------------- */}
        {step === 2 && (
          <div>
            {stepHeading("Review and create", "Check the details. You can go back to change anything.")}
            <dl className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <ReviewRow label="Name" onEdit={() => goTo(0, "channel-name")}>
                <span className="font-medium text-slate-900">{name.trim()}</span>
              </ReviewRow>
              <ReviewRow label="Starts with" onEdit={() => goTo(1)}>
                <span className="font-medium text-slate-900">{audienceLabel}</span>
                {audience === "branch" && branchName && (
                  <span className="text-slate-600"> · {branchName}</span>
                )}
              </ReviewRow>
              <ReviewRow label="Members" onEdit={() => goTo(1, "member-search")}>
                <span className="font-medium text-slate-900">
                  {plural(selected.size, "person", "people")}
                </span>
                <span className="text-slate-600"> and you</span>
                {selectedNames.length > 0 && (
                  <span className="mt-1 block text-xs text-slate-500">
                    {selectedNames.slice(0, MAX_REVIEW_NAMES).join(", ")}
                    {selectedNames.length > MAX_REVIEW_NAMES &&
                      ` and ${selectedNames.length - MAX_REVIEW_NAMES} more`}
                  </span>
                )}
              </ReviewRow>
            </dl>
          </div>
        )}
      </form>
    </Modal>
  );
};

const Placeholder = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
    {children}
  </div>
);

const ReviewRow = ({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <div className="min-w-0 text-sm">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Change ${label.toLowerCase()}`}
      className="shrink-0 rounded text-sm font-medium text-purple-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      Change
    </button>
  </div>
);

export default CreateChannelModal;
