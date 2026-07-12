import { createHash, timingSafeEqual } from "node:crypto";

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Verify a write-only sync capability without handling the recovery code. */
export function validSyncWriteCapability(
  id: string,
  token: string | null
): boolean {
  if (!token || !BASE64URL_PATTERN.test(token) || token.length > 64) return false;
  let tokenBytes: Buffer;
  try {
    tokenBytes = Buffer.from(token, "base64url");
  } catch {
    return false;
  }
  if (tokenBytes.byteLength !== 32 || id.length !== 64) return false;
  const derivedId = createHash("sha256").update(tokenBytes).digest("hex");
  return timingSafeEqual(Buffer.from(derivedId), Buffer.from(id));
}
