export type RoomType = "DIRECT" | "BRANCH" | "GLOBAL" | "LEAD";

export interface ChatParticipant {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface ChatLastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  name?: string;
  type: RoomType;
  participants: ChatParticipant[];
  branchId?: { _id: string; name: string };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatLastMessage;
  lastMessageAt?: string;
  unreadCount: number;
  /** DIRECT only */
  otherUser?: ChatParticipant | null;
  /** DIRECT only: either side has direct messages turned off. */
  readOnly?: boolean;
  /** DIRECT only: when the other person last read the conversation. */
  otherLastReadAt?: string | null;
}

export type MessageStatus = "sending" | "failed";

export interface ChatMessage {
  _id: string;
  roomId: string;
  senderId: ChatParticipant;
  content: string;
  createdAt: string;
  /** Set on the sender's own messages to match the optimistic copy. */
  clientId?: string;
  /** Local only: optimistic message not yet confirmed by the server. */
  status?: MessageStatus;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
}
