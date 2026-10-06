// src/services/stringeeApi.ts
import { apiClient } from "./apiClient";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

// Refresh a bit before actual expiry so we never hand out a token that
// dies mid-call. Backend issues 1hr tokens (see generateStringeeToken).
const SAFETY_MARGIN_MS = 5 * 60 * 1000; // 5 min

const fetchFreshToken = async (): Promise<string> => {
  const { data } = await apiClient.get<{ success: boolean; token: string }>(
    "/dialer/token"
  );
  // Decode exp from the JWT payload instead of hardcoding 1hr client-side —
  // stays correct even if the backend's token TTL changes later.
  const payloadB64 = data.token.split(".")[1];
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  const expiresAt = payload.exp * 1000;

  cached = { token: data.token, expiresAt };
  return data.token;
};

export const stringeeApi = {
  /**
   * GET /dialer/token — returns a cached token if it's still valid (with a
   * safety margin), otherwise fetches a new one. Concurrent callers during
   * a fetch share the same in-flight promise instead of firing duplicate
   * requests (guards against StrictMode double-invoke and multiple callers).
   */
  getToken: async (): Promise<string> => {
    if (cached && cached.expiresAt - SAFETY_MARGIN_MS > Date.now()) {
      return cached.token;
    }

    if (inFlight) return inFlight;

    inFlight = fetchFreshToken().finally(() => {
      inFlight = null;
    });

    return inFlight;
  },

  /** Force-clear the cache — call this on logout or auth failure. */
  clearCachedToken: () => {
    cached = null;
  },
};