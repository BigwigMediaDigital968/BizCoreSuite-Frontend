import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useAuthStore } from "@/store/auth.store";
import type { ChatMessage, ChatMessagePage, ChatRoom } from "@/types/chat";
import {
  addRoomMembers,
  createChannel,
  getChannelCandidates,
  getChatUsers,
  getMyRooms,
  getOrCreateDirectRoom,
  getRoomInfo,
  getRoomMessages,
  getUserChannelAccess,
  getUserChatSettings,
  leaveRoom,
  markRoomRead,
  removeRoomMember,
  updateUserChatSettings,
} from "../api/chatApi";

export const chatKeys = {
  rooms: ["chat", "rooms"] as const,
  messages: (roomId: string) => ["chat", "messages", roomId] as const,
  users: (search: string) => ["chat", "users", search] as const,
  settings: (userId: string) => ["chat", "settings", userId] as const,
  candidates: ["chat", "channel-candidates"] as const,
  info: (roomId: string) => ["chat", "info", roomId] as const,
  channelAccess: (userId: string) =>
    ["chat", "channel-access", userId] as const,
};

type MessagesData = InfiniteData<ChatMessagePage, string | undefined>;

// ---------------------------------------------------------------------------
// Cache helpers (shared by the socket listeners and the send flow).
// Message pages: pages[0] is the newest page; each page is oldest-first.
// ---------------------------------------------------------------------------

/** Adds a message to its room's loaded history, replacing its optimistic copy. */
export const upsertMessageInCache = (qc: QueryClient, message: ChatMessage) => {
  qc.setQueryData<MessagesData>(chatKeys.messages(message.roomId), (data) => {
    // History not loaded yet — the fetch on open will include it.
    if (!data) return data;
    if (data.pages.some((p) => p.messages.some((m) => m._id === message._id))) {
      return data;
    }

    const [newest, ...older] = data.pages;
    const optimistic = message.clientId
      ? newest.messages.findIndex((m) => m.clientId === message.clientId)
      : -1;
    const messages =
      optimistic >= 0
        ? newest.messages.map((m, i) => (i === optimistic ? message : m))
        : [...newest.messages, message];

    return { ...data, pages: [{ ...newest, messages }, ...older] };
  });
};

export const updateOptimisticMessage = (
  qc: QueryClient,
  roomId: string,
  clientId: string,
  update: (message: ChatMessage) => ChatMessage | null
) => {
  qc.setQueryData<MessagesData>(chatKeys.messages(roomId), (data) => {
    if (!data) return data;
    const [newest, ...older] = data.pages;
    const messages = newest.messages.flatMap((m) => {
      if (m.clientId !== clientId || !m.status) return [m];
      const next = update(m);
      return next ? [next] : [];
    });
    return { ...data, pages: [{ ...newest, messages }, ...older] };
  });
};

export const updateRoomInCache = (
  qc: QueryClient,
  roomId: string,
  update: (room: ChatRoom) => ChatRoom
) => {
  qc.setQueryData<ChatRoom[]>(chatKeys.rooms, (rooms) =>
    rooms?.map((r) => (r._id === roomId ? update(r) : r))
  );
};

const activityOf = (r: ChatRoom) =>
  new Date(r.lastMessageAt ?? r.createdAt).getTime();

/** Moves a room to its place after its activity time changed. */
export const sortRoomsInCache = (qc: QueryClient) => {
  qc.setQueryData<ChatRoom[]>(chatKeys.rooms, (rooms) =>
    rooms ? [...rooms].sort((a, b) => activityOf(b) - activityOf(a)) : rooms
  );
};

// ---------------------------------------------------------------------------
// Queries & mutations
// ---------------------------------------------------------------------------

export const useChatRooms = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: chatKeys.rooms,
    queryFn: getMyRooms,
    enabled: isAuthenticated,
    // Pick up channels/DMs other people created since the last visit.
    staleTime: 0,
  });
};

/** Total unread across all rooms, for the sidebar badge. */
export const useChatUnreadTotal = () => {
  const { data: rooms = [] } = useChatRooms();
  return rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
};

export const useRoomMessages = (roomId: string | null) =>
  useInfiniteQuery({
    queryKey: chatKeys.messages(roomId ?? ""),
    queryFn: ({ pageParam }) => getRoomMessages(roomId as string, pageParam),
    initialPageParam: undefined as string | undefined,
    // Next page = older than the oldest message loaded so far.
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.messages[0]?._id : undefined,
    enabled: !!roomId,
    // Override the app-wide 5 min staleTime: always re-sync history when a
    // room is opened, covering anything sent while the socket was down.
    staleTime: 0,
  });

export const useMarkRoomRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markRoomRead,
    onMutate: (roomId) =>
      updateRoomInCache(queryClient, roomId, (r) => ({ ...r, unreadCount: 0 })),
  });
};

/** Everyone a head/admin can add to a new channel. */
export const useChannelCandidates = (enabled = true) =>
  useQuery({
    queryKey: chatKeys.candidates,
    queryFn: getChannelCandidates,
    enabled,
    staleTime: 60_000,
  });

export const useChatUsers = (search: string, enabled: boolean) =>
  useQuery({
    queryKey: chatKeys.users(search),
    queryFn: () => getChatUsers(search),
    enabled,
    staleTime: 30_000,
  });

export const useOpenDirectRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getOrCreateDirectRoom,
    onSuccess: (room) => {
      queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms, (prev) =>
        prev && !prev.some((r) => r._id === room._id) ? [room, ...prev] : prev
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't open the conversation"));
    },
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChannel,
    onSuccess: (room) => {
      toast.success("Channel created");
      // Show it immediately; the refetch then fills in populated fields.
      queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms, (prev) =>
        prev
          ? [{ ...room, unreadCount: 0 }, ...prev.filter((r) => r._id !== room._id)]
          : prev
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    },
    // No toast: the create page shows the reason next to the field it
    // concerns (or its own toast), so the message isn't shown twice.
  });
};

export const useUserChatSettings = (userId: string | undefined) =>
  useQuery({
    queryKey: chatKeys.settings(userId ?? ""),
    queryFn: () => getUserChatSettings(userId as string),
    enabled: !!userId,
  });

export const useUpdateUserChatSettings = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (canDirectMessage: boolean) =>
      updateUserChatSettings(userId, { canDirectMessage }),
    onSuccess: (settings) => {
      queryClient.setQueryData(chatKeys.settings(userId), settings);
      toast.success(
        settings.canDirectMessage
          ? "Direct messages turned on"
          : "Direct messages turned off"
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't update direct messages"));
    },
  });
};

// ---------------------------------------------------------------------------
// Room info panel
// ---------------------------------------------------------------------------

export const useRoomInfo = (roomId: string | null) =>
  useQuery({
    queryKey: chatKeys.info(roomId ?? ""),
    queryFn: () => getRoomInfo(roomId as string),
    enabled: !!roomId,
    staleTime: 30_000,
  });

/** Anything that changes who is in a room refreshes the list and the panel. */
const useRefreshRoom = () => {
  const queryClient = useQueryClient();
  return (roomId: string) => {
    queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    queryClient.invalidateQueries({ queryKey: chatKeys.info(roomId) });
  };
};

export const useLeaveRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveRoom,
    onSuccess: (_data, roomId) => {
      // Drop it from the list right away; the refetch confirms.
      queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms, (prev) =>
        prev?.filter((r) => r._id !== roomId)
      );
      queryClient.removeQueries({ queryKey: chatKeys.messages(roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't leave the channel"));
    },
  });
};

export const useAddRoomMembers = (roomId: string) => {
  const refresh = useRefreshRoom();
  return useMutation({
    mutationFn: (userIds: string[]) => addRoomMembers(roomId, userIds),
    onSuccess: () => refresh(roomId),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't add people"));
    },
  });
};

export const useRemoveRoomMember = (roomId: string) => {
  const refresh = useRefreshRoom();
  return useMutation({
    mutationFn: (userId: string) => removeRoomMember(roomId, userId),
    onSuccess: () => refresh(roomId),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't remove that person"));
    },
  });
};

// ---------------------------------------------------------------------------
// Access tab on the employee profile (head / admin)
// ---------------------------------------------------------------------------

export const useUserChannelAccess = (userId: string | undefined) =>
  useQuery({
    queryKey: chatKeys.channelAccess(userId ?? ""),
    queryFn: () => getUserChannelAccess(userId as string),
    enabled: !!userId,
  });

/** Add a person to, or remove them from, a channel from their profile. */
export const useChangeChannelAccess = (userId: string) => {
  const queryClient = useQueryClient();
  const refresh = (roomId: string) => {
    queryClient.invalidateQueries({ queryKey: chatKeys.channelAccess(userId) });
    queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    queryClient.invalidateQueries({ queryKey: chatKeys.info(roomId) });
  };

  const add = useMutation({
    mutationFn: (roomId: string) => addRoomMembers(roomId, [userId]),
    onSuccess: (_data, roomId) => refresh(roomId),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't add them to the channel"));
    },
  });

  const remove = useMutation({
    mutationFn: (roomId: string) => removeRoomMember(roomId, userId),
    onSuccess: (_data, roomId) => refresh(roomId),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't remove them from the channel"));
    },
  });

  return { add, remove };
};
