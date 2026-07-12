/**
 * Bring-your-own-key storage. Keys use sessionStorage by default and ride
 * along on same-origin API calls as headers. Persistent localStorage is an
 * explicit user choice. The server never stores them.
 */

import { PROVIDER_IDS, type ProviderId } from "./providers";

const STORAGE_KEY = "sketchcast.keys.v2";
const LEGACY_KEY = "sketchcast.keys.v1";

export interface UserKeys {
  provider: ProviderId;
  keys: Record<ProviderId, string>;
  /** Optional model override for the active provider */
  model: string;
  deepgram: string;
}

const EMPTY: UserKeys = {
  provider: "anthropic",
  keys: { anthropic: "", openai: "", openrouter: "", gemini: "" },
  model: "",
  deepgram: "",
};

export function getUserKeys(): UserKeys {
  if (typeof window === "undefined") return { ...EMPTY, keys: { ...EMPTY.keys } };
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserKeys>;
      const keys = { ...EMPTY.keys };
      for (const id of PROVIDER_IDS) {
        const value = parsed.keys?.[id];
        if (typeof value === "string") keys[id] = value;
      }
      return {
        provider: PROVIDER_IDS.includes(parsed.provider as ProviderId)
          ? (parsed.provider as ProviderId)
          : "anthropic",
        keys,
        model: typeof parsed.model === "string" ? parsed.model : "",
        deepgram: typeof parsed.deepgram === "string" ? parsed.deepgram : "",
      };
    }
    // Migrate the v1 single-provider shape
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { anthropic?: string; deepgram?: string };
      return {
        ...EMPTY,
        keys: { ...EMPTY.keys, anthropic: parsed.anthropic ?? "" },
        deepgram: parsed.deepgram ?? "",
      };
    }
  } catch {
    // fall through to empty
  }
  return { ...EMPTY, keys: { ...EMPTY.keys } };
}

export function setUserKeys(keys: UserKeys): void {
  const cleaned: UserKeys = {
    provider: keys.provider,
    keys: Object.fromEntries(
      PROVIDER_IDS.map((id) => [id, (keys.keys[id] ?? "").trim()])
    ) as Record<ProviderId, string>,
    model: keys.model.trim(),
    deepgram: keys.deepgram.trim(),
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

export function userKeysArePersistent(): boolean {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(STORAGE_KEY) !== null
  );
}

export function setUserKeyPersistence(persist: boolean): void {
  if (typeof window === "undefined") return;
  const sessionValue = window.sessionStorage.getItem(STORAGE_KEY);
  if (persist && sessionValue) {
    window.localStorage.setItem(STORAGE_KEY, sessionValue);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  }
}

/** Headers to attach to API calls so the server uses the user's keys */
export function apiKeyHeaders(): Record<string, string> {
  const stored = getUserKeys();
  const headers: Record<string, string> = {};
  const activeKey = stored.keys[stored.provider];
  if (activeKey) {
    headers["x-ai-provider"] = stored.provider;
    headers["x-ai-key"] = activeKey;
    if (stored.model) headers["x-ai-model"] = stored.model;
  }
  if (stored.deepgram) headers["x-deepgram-key"] = stored.deepgram;
  return headers;
}
