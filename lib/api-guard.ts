/**
 * Server-side guard shared by the API routes that spend Anthropic API
 * credits. The routes are intentionally unauthenticated (local,
 * single-user tool), so this closes the cheap abuse paths:
 *
 * 1. Cross-site browser calls. A malicious page open in the same browser
 *    can fire "simple" POSTs at http://localhost:3000 while the dev server
 *    runs, silently burning API credits. Same-origin pages always send a
 *    matching Origin header on POST; anything else is rejected.
 * 2. Oversized bodies buffered by request.json().
 * 3. Scripted request floods (fixed-window, per-client rate limit).
 *
 * Note before any public deployment: this is abuse hardening, not auth.
 * Deploying these routes publicly still needs a real authentication layer.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
// Cap across ALL clients: the per-client key comes from a spoofable header,
// so the global window is what actually stops scripted floods
const GLOBAL_MAX_REQUESTS_PER_WINDOW = 60;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TRACKED_CLIENTS = 1_000;

interface WindowEntry {
  count: number;
  windowStart: number;
}

const requestCounts = new Map<string, WindowEntry>();
const globalWindow: WindowEntry = { count: 0, windowStart: 0 };

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

export interface GuardOptions {
  /** Override the body cap, e.g. for audio uploads to /api/transcribe */
  maxBodyBytes?: number;
  /** Acceptable Content-Type prefixes; defaults to JSON only */
  allowedContentTypes?: string[];
}

/**
 * Returns an error Response when the request should be rejected,
 * or null when the route may proceed.
 */
export function guardApiRequest(
  request: Request,
  options: GuardOptions = {}
): Response | null {
  const maxBodyBytes = options.maxBodyBytes ?? MAX_BODY_BYTES;
  const allowedContentTypes = options.allowedContentTypes ?? ["application/json"];
  // Same-origin check: browsers attach Origin to every POST. When it is
  // present it must match the host we are serving on. Non-browser clients
  // (curl, scripts) omit it and pass through; the global rate limit below
  // bounds what they can spend (the per-client key is spoofable).
  const origin = request.headers.get("origin");
  if (origin) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || !host || originHost !== host) {
      return Response.json(
        { error: "Cross-origin requests are not allowed" },
        { status: 403 }
      );
    }
  }
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return Response.json(
      { error: "Cross-origin requests are not allowed" },
      { status: 403 }
    );
  }

  // Requiring the JSON content type forces cross-origin browser callers
  // into a CORS preflight, which fails because these routes never send
  // CORS headers. It also matches what the UI actually sends.
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!allowedContentTypes.some((t) => contentType.startsWith(t))) {
    return Response.json(
      { error: `Content-Type must be one of: ${allowedContentTypes.join(", ")}` },
      { status: 415 }
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  // Fixed-window rate limits so a stuck loop or a script cannot drain the
  // Anthropic account. In-memory is fine for a single-process local app.
  // The global window is the real backstop: it holds no matter how many
  // distinct client keys a flood invents via header rotation.
  const now = Date.now();
  if (now - globalWindow.windowStart >= WINDOW_MS) {
    globalWindow.windowStart = now;
    globalWindow.count = 0;
  }
  globalWindow.count += 1;
  if (globalWindow.count > GLOBAL_MAX_REQUESTS_PER_WINDOW) {
    return Response.json(
      { error: "Too many requests. Wait a minute and try again." },
      { status: 429 }
    );
  }

  const key = clientKey(request);
  const entry = requestCounts.get(key);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    requestCounts.set(key, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
    if (entry.count > MAX_REQUESTS_PER_WINDOW) {
      return Response.json(
        { error: "Too many requests. Wait a minute and try again." },
        { status: 429 }
      );
    }
  }

  // Keep the map bounded when many distinct client keys show up
  if (requestCounts.size > MAX_TRACKED_CLIENTS) {
    for (const [k, v] of requestCounts) {
      if (now - v.windowStart >= WINDOW_MS) requestCounts.delete(k);
    }
  }

  return null;
}
