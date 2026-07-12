import { get, put } from "@vercel/blob";

import { guardApiRequest } from "@/lib/api-guard";
import { creatorEntitlement, syncRequiresCreator } from "@/lib/creator-cloud";
import type { SyncEnvelope } from "@/lib/project-sync";
import { validSyncWriteCapability } from "@/lib/sync-capability";

export const maxDuration = 30;

const ID_PATTERN = /^[a-f0-9]{64}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_SYNC_BYTES = 1024 * 1024;

function pathname(id: string): string {
  return `project-sync/${id}.json`;
}

function configured(): boolean {
  return Boolean(
    process.env.SKETCHCAST_ENABLE_CLOUD_SYNC === "true" &&
      (process.env.BLOB_READ_WRITE_TOKEN ||
        (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID))
  );
}

async function paidSyncGuard(): Promise<Response | null> {
  if (!syncRequiresCreator()) return null;
  const entitlement = await creatorEntitlement();
  if (!entitlement.userId) {
    return Response.json({ error: "Sign in to use hosted encrypted sync" }, { status: 401 });
  }
  if (entitlement.plan !== "creator") {
    return Response.json({ error: "Encrypted sync requires Creator Cloud" }, { status: 402 });
  }
  return null;
}

export async function GET(request: Request) {
  const guard = guardApiRequest(request, { requireContentType: false });
  if (guard) return guard;
  if (!configured()) {
    return Response.json({ error: "Cloud sync is not configured" }, { status: 503 });
  }
  const paidGuard = await paidSyncGuard();
  if (paidGuard) return paidGuard;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!ID_PATTERN.test(id)) {
    return Response.json({ error: "Invalid sync id" }, { status: 400 });
  }
  const result = await get(pathname(id), { access: "private", useCache: false });
  if (!result) return Response.json({ error: "Cloud project not found" }, { status: 404 });
  const envelope = (await new Response(result.stream).json()) as SyncEnvelope;
  return Response.json({ envelope }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const guard = guardApiRequest(request, { maxBodyBytes: MAX_SYNC_BYTES });
  if (guard) return guard;
  if (!configured()) {
    return Response.json({ error: "Cloud sync is not configured" }, { status: 503 });
  }
  const paidGuard = await paidSyncGuard();
  if (paidGuard) return paidGuard;
  let body: { id?: string; envelope?: SyncEnvelope };
  try {
    body = (await request.json()) as { id?: string; envelope?: SyncEnvelope };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id || !ID_PATTERN.test(body.id) || body.envelope?.version !== 1) {
    return Response.json({ error: "Invalid encrypted project" }, { status: 400 });
  }
  if (!validSyncWriteCapability(body.id, request.headers.get("x-sync-write-token"))) {
    return Response.json({ error: "Invalid sync write capability" }, { status: 403 });
  }
  if (
    !body.envelope.iv ||
    !BASE64URL_PATTERN.test(body.envelope.iv) ||
    body.envelope.iv.length > 32 ||
    !body.envelope.ciphertext ||
    !BASE64URL_PATTERN.test(body.envelope.ciphertext) ||
    body.envelope.ciphertext.length > MAX_SYNC_BYTES
  ) {
    return Response.json({ error: "Encrypted project is incomplete" }, { status: 400 });
  }
  await put(pathname(body.id), JSON.stringify(body.envelope), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  return Response.json({ ok: true, syncedAt: new Date().toISOString() });
}
