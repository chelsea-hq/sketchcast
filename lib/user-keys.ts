/**
 * Bring-your-own-key storage. Keys live only in this browser's
 * localStorage and ride along on same-origin API calls as headers;
 * the server never stores them.
 */

const STORAGE_KEY = "sketchcast.keys.v1";

export interface UserKeys {
  anthropic: string;
  deepgram: string;
}

export function getUserKeys(): UserKeys {
  if (typeof window === "undefined") return { anthropic: "", deepgram: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<UserKeys>) : {};
    return {
      anthropic: typeof parsed.anthropic === "string" ? parsed.anthropic : "",
      deepgram: typeof parsed.deepgram === "string" ? parsed.deepgram : "",
    };
  } catch {
    return { anthropic: "", deepgram: "" };
  }
}

export function setUserKeys(keys: UserKeys): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      anthropic: keys.anthropic.trim(),
      deepgram: keys.deepgram.trim(),
    })
  );
}

/** Headers to attach to API calls so the server uses the user's keys */
export function apiKeyHeaders(): Record<string, string> {
  const keys = getUserKeys();
  const headers: Record<string, string> = {};
  if (keys.anthropic) headers["x-anthropic-key"] = keys.anthropic;
  if (keys.deepgram) headers["x-deepgram-key"] = keys.deepgram;
  return headers;
}
