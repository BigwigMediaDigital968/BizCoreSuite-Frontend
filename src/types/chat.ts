export type RoomType = "DIRECT" | "BRANCH" | "GLOBAL" | "LEAD";

export interface ChatParticipant {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface ChatRoom {
  _id: string;
  name?: string;
  type: RoomType;
  participants: ChatParticipant[];
  branchId?: { _id: string; name: string };
  isArchived: boolean;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  roomId: string;
  senderId: ChatParticipant;
  content: string;
  createdAt: string;
}