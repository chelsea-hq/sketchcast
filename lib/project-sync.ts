import type { ProjectSnapshot, SketchProject } from "./recovery-vault";

export interface SyncEnvelope {
  version: 1;
  iv: string;
  ciphertext: string;
}

export interface SyncedProject {
  version: 1;
  name: string;
  snapshot: ProjectSnapshot;
  updatedAt: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

async function keyMaterial(syncCode: string): Promise<{ id: string; key: CryptoKey }> {
  const secret = base64UrlToBytes(syncCode.trim());
  if (secret.byteLength !== 32) throw new Error("That recovery code is not valid");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", arrayBuffer(secret)));
  const key = await crypto.subtle.importKey("raw", arrayBuffer(digest), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
  return { id: Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(""), key };
}

export function generateSyncCode(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function encryptProject(
  project: SketchProject,
  syncCode: string
): Promise<{ id: string; envelope: SyncEnvelope }> {
  const { id, key } = await keyMaterial(syncCode);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload: SyncedProject = {
    version: 1,
    name: project.name,
    updatedAt: project.updatedAt,
    snapshot: {
      format: project.format,
      script: project.script,
      webcam: project.webcam,
      scene: project.scene,
    },
  };
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: arrayBuffer(iv) },
      key,
      arrayBuffer(encoded)
    )
  );
  return {
    id,
    envelope: {
      version: 1,
      iv: bytesToBase64Url(iv),
      ciphertext: bytesToBase64Url(ciphertext),
    },
  };
}

export async function decryptProject(
  envelope: SyncEnvelope,
  syncCode: string
): Promise<SyncedProject> {
  if (envelope.version !== 1) throw new Error("This sync format is not supported");
  const { key } = await keyMaterial(syncCode);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: arrayBuffer(base64UrlToBytes(envelope.iv)) },
      key,
      arrayBuffer(base64UrlToBytes(envelope.ciphertext))
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as SyncedProject;
    if (payload.version !== 1 || !payload.name || !payload.snapshot?.scene) {
      throw new Error("Cloud project is incomplete");
    }
    return payload;
  } catch {
    throw new Error("That recovery code could not unlock this project");
  }
}

export async function syncIdFromCode(syncCode: string): Promise<string> {
  return (await keyMaterial(syncCode)).id;
}
