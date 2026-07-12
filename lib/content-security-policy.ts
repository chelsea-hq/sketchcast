const STATIC_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "frame-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
];

function validHttpsOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" && url.pathname === "/" ? url.origin : null;
  } catch {
    return null;
  }
}

/** Decode Clerk's public frontend API hostname without exposing secret data. */
export function clerkFrontendOrigin(publishableKey: string | undefined): string | null {
  if (!publishableKey?.startsWith("pk_")) return null;
  const encoded = publishableKey.split("_").slice(2).join("_");
  if (!encoded) return null;
  try {
    const hostname = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
    return validHttpsOrigin(hostname);
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(options: {
  nonce: string;
  clerkOrigin?: string | null;
  production: boolean;
}): string {
  const clerkOrigin = validHttpsOrigin(options.clerkOrigin ?? undefined);
  const scripts = [
    "'self'",
    `'nonce-${options.nonce}'`,
    "'strict-dynamic'",
    // Fallback allowlists for browsers that do not support strict-dynamic.
    "https:",
    ...(options.production ? [] : ["'unsafe-eval'", "http:"]),
  ];
  const connections = [
    "'self'",
    ...(clerkOrigin ? [clerkOrigin] : []),
    "https://clerk-telemetry.com",
    "https://*.clerk-telemetry.com",
  ];
  return [
    `script-src ${scripts.join(" ")}`,
    `connect-src ${connections.join(" ")}`,
    ...STATIC_DIRECTIVES,
    ...(options.production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
