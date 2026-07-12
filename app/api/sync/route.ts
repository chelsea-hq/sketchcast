import { get, put } from "@vercel/blob";

import { guardApiRequest } from "@/lib/api-guard";
import type { SyncEnvelope } from "@/lib/project-sync";

export const maxDuration = 30;

const ID_PATTERN = /^[a-f0-9]{64}$/;
const MAX_SYNC_BYTES = 8 * 1024 * 1024;

function pathname(id: string): string {
  return `project-sync/${id}.json`;
}

function configured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );
}

export async function GET(request: Request) {
  const guard = guardApiRequest(request, { requireContentType: false });
  if (guard) return guard;
  if (!configured()) {
    return Response.json({ error: "Cloud sync is not configured" }, { status: 503 });
  }
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
  const body = (await request.json()) as { id?: string; envelope?: SyncEnvelope };
  if (!body.id || !ID_PATTERN.test(body.id) || body.envelope?.version !== 1) {
    return Response.json({ error: "Invalid encrypted project" }, { status: 400 });
  }
  if (!body.envelope.iv || !body.envelope.ciphertext) {
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
