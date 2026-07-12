import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { defaultWebcamLayout } from "./formats";
import {
  decryptProject,
  encryptProject,
  generateSyncCode,
  legacySyncIdFromCode,
  syncIdFromCode,
  syncWriteTokenFromCode,
} from "./project-sync";
import type { SketchProject } from "./recovery-vault";

function project(): SketchProject {
  return {
    id: "project_test",
    name: "Launch explainer",
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:01.000Z",
    format: "9:16",
    script: "Three clear steps",
    webcam: defaultWebcamLayout("9:16"),
    scene: {
      elements: [{ id: "shape_1", type: "rectangle" }],
      files: {},
      viewBackgroundColor: "#ffffff",
    },
  };
}

describe("encrypted project sync", () => {
  it("round-trips a project without exposing plaintext", async () => {
    const syncCode = generateSyncCode();
    const { id, envelope } = await encryptProject(project(), syncCode);

    expect(id).toMatch(/^[a-f0-9]{64}$/);
    expect(envelope.ciphertext).not.toContain("Three clear steps");
    expect(await decryptProject(envelope, syncCode)).toEqual({
      version: 1,
      name: "Launch explainer",
      updatedAt: "2026-07-11T00:00:01.000Z",
      snapshot: {
        format: "9:16",
        script: "Three clear steps",
        webcam: defaultWebcamLayout("9:16"),
        scene: project().scene,
      },
    });
  });

  it("derives a stable private lookup id and rejects the wrong code", async () => {
    const syncCode = generateSyncCode();
    const encrypted = await encryptProject(project(), syncCode);

    expect(await syncIdFromCode(syncCode)).toBe(encrypted.id);
    expect(await legacySyncIdFromCode(syncCode)).not.toBe(encrypted.id);
    const writeToken = await syncWriteTokenFromCode(syncCode);
    expect(writeToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(
      createHash("sha256").update(Buffer.from(writeToken, "base64url")).digest("hex")
    ).toBe(encrypted.id);
    await expect(decryptProject(encrypted.envelope, generateSyncCode())).rejects.toThrow(
      "could not unlock"
    );
  });
});
