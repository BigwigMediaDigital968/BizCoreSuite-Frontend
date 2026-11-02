import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

const user = useAuthStore.getState().user;
const role = user?.role;
const userId = user?._id;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  query: {
    userId,
    role,
  },
});
