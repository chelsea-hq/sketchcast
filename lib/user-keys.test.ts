import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserKeys } from "./user-keys";
import {
  getUserKeys,
  setUserKeyPersistence,
  setUserKeys,
  userKeysArePersistent,
} from "./user-keys";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const KEYS: UserKeys = {
  provider: "anthropic",
  keys: {
    anthropic: "test-anthropic",
    openai: "",
    openrouter: "",
    gemini: "",
  },
  model: "test-model",
  deepgram: "test-deepgram",
};

describe("browser API key storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: new MemoryStorage(),
      sessionStorage: new MemoryStorage(),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("keeps keys session-only by default", () => {
    setUserKeys(KEYS);

    expect(getUserKeys()).toEqual(KEYS);
    expect(userKeysArePersistent()).toBe(false);
  });

  it("persists keys only after an explicit opt-in", () => {
    setUserKeys(KEYS);
    setUserKeyPersistence(true);
    expect(userKeysArePersistent()).toBe(true);

    setUserKeyPersistence(false);
    expect(userKeysArePersistent()).toBe(false);
  });
});
