import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/services/authApi";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

// Give up after this many back-to-back auth failures (e.g. account disabled).
const MAX_AUTH_RETRIES = 3;

let socket: Socket | null = null;
let connectedUserId: string | null = null;

/**
 * Opens (or reuses) the single app-wide socket for the signed-in user.
 * The backend identifies the user from the access token alone, so the socket
 * is created on demand after login and recreated whenever the user changes.
 */
export const connectSocket = (userId: string): Socket => {
  if (socket && connectedUserId === userId) return socket;

  disconnectSocket();

  const s = io(SOCKET_URL, {
    // Callback form so reconnects pick up the latest (refreshed) token.
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
  });

  // Socket.IO doesn't retry when the server rejects the handshake. That
  // usually means the access token expired: any API call refreshes it via the
  // apiClient interceptor, after which we reconnect with the new token.
  let authRetries = 0;
  s.on("connect", () => {
    authRetries = 0;
  });
  s.on("connect_error", async (err) => {
    if (err.message !== "unauthorized" || authRetries >= MAX_AUTH_RETRIES) {
      return;
    }
    authRetries += 1;
    try {
      await authApi.me();
    } catch {
      return; // Refresh failed — the interceptor sends the user to login.
    }
    if (socket === s) s.connect();
  });

  socket = s;
  connectedUserId = userId;

  return s;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  connectedUserId = null;
};
