import { describe, expect, it } from "vitest";

import {
  generateSyncCode,
  syncIdFromCode,
  syncWriteTokenFromCode,
} from "./project-sync";
import { validSyncWriteCapability } from "./sync-capability";

describe("sync write capabilities", () => {
  it("accepts only the capability derived for the lookup id", async () => {
    const code = generateSyncCode();
    const id = await syncIdFromCode(code);
    const token = await syncWriteTokenFromCode(code);

    expect(validSyncWriteCapability(id, token)).toBe(true);
    expect(
      validSyncWriteCapability(id, await syncWriteTokenFromCode(generateSyncCode()))
    ).toBe(false);
    expect(validSyncWriteCapability(id, null)).toBe(false);
  });
});
