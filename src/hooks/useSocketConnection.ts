import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";

/**
 * Ties the socket lifecycle to the auth session: connects once a user is
 * signed in, reconnects if the user changes, and disconnects on logout.
 */
export const useSocketConnection = () => {
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!userId) return;

    connectSocket(userId);
    return () => disconnectSocket();
  }, [userId]);
};
