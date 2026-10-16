# Sketchcast Security Model

## Goals

Sketchcast should be safe to clone, run locally, and deploy without silently
turning the maintainer's credentials or storage account into a public service.
It should also be clear which data leaves the browser and when.

## Trust boundaries

### Browser-only data

- Board scenes, scripts, templates, webcam layout, and recordings are stored in
  browser storage.
- Provider keys use session storage by default. Persistent local storage is an
  explicit opt-in.
- Recordings are not included in cloud sync.

Browser storage is not a hardware vault. Malicious extensions, compromised
devices, or a successful script injection could read it. Use separate provider
keys with spend caps and revoke them if a device is lost.

### Local project files

`.sketchcast` files are unencrypted, user-requested downloads. They include the
board, supported embedded raster images, script, format and webcam layout;
recordings, provider configuration, recovery capabilities, and account state are
excluded. Private text written into the board or script remains in the file.

Import validates a versioned allowlist before creating a separate local project.
Byte, object-depth, element, image-decoding and drawing-work limits constrain
untrusted files. Remote images, SVG, web embeds and prototype keys are rejected;
hyperlinks and unknown metadata are removed. The parser's exact limits are in
[project-file.ts](../lib/project-file.ts) and the user guide is
[PROJECT-FILES.md](PROJECT-FILES.md). File operations do not upload content.

Vault operations report success after IndexedDB transaction completion. Failed
autosaves show a persistent alert with retry and a download path for the current
in-memory project. These controls do not guarantee unlimited storage or recovery
after browser data is cleared.

### AI and transcription requests

The browser sends a user-supplied key to a same-origin route. That route calls
the selected provider and does not persist the key. Provider prompts and audio
are still processed under that provider's terms.

Server environment keys are ignored unless
`SKETCHCAST_ALLOW_SERVER_KEYS=true`. Even then, AI and transcription routes use
them only for an authenticated account with an active Creator subscription and
an available durable monthly quota. BYOK requests bypass the hosted quota and
never fall back silently to a host-funded key.

### Encrypted cloud sync

Cloud sync is ignored unless `SKETCHCAST_ENABLE_CLOUD_SYNC=true` and a private
Blob store is configured. The browser encrypts project metadata with AES-GCM.
The recovery code never leaves the browser.

A write-only capability is derived separately from the recovery code. The
server verifies that capability before accepting an overwrite. The capability
cannot decrypt project data. Anyone with the recovery code can still read,
decrypt, and replace that project's cloud copy, so the recovery code must be
treated like a password.

Cloud sync protects confidentiality, not host cost. Public hosts must add a
durable rate limit for `/api/sync` and monitor storage and egress. Hosted
Creator Cloud should also set `SKETCHCAST_REQUIRE_SYNC_SUBSCRIPTION=true`; the
API then verifies an active subscription for reads and writes.

### Accounts, billing, and quotas

- Clerk owns authentication sessions; Sketchcast stores no passwords.
- Stripe Checkout receives only server-selected Price IDs. Entitlements are
  updated only from signature-verified Stripe webhooks.
- Subscription writes compare Stripe event timestamps atomically, preventing a
  delayed older webhook from replacing a newer entitlement state.
- Upstash stores Stripe customer/subscription identifiers, subscription status,
  renewal timestamps, and monthly usage counters. It does not store prompts,
  provider keys, recordings, recovery codes, or plaintext projects.
- Atomic Redis scripts reject managed usage above either the account quota or
  the deployment-wide monthly cost ceiling.
- Missing configuration fails closed to the Community plan.

## Safe hosting profiles

### Default public fork

- Keep `SKETCHCAST_ALLOW_SERVER_KEYS=false`.
- Keep `SKETCHCAST_ENABLE_CLOUD_SYNC=false`.
- Users provide their own provider keys.
- No account system is required.

### Public BYOK with sync

- Keep shared provider keys disabled.
- Use a private Blob store.
- Enable sync explicitly.
- Add a platform rate limit for `/api/sync` before launch.
- Set storage budgets and alerts with the hosting provider.

### Hosted paid service

- Configure Clerk, Stripe, and Upstash.
- Verify the Stripe webhook before enabling checkout.
- Set `SKETCHCAST_REQUIRE_SYNC_SUBSCRIPTION=true`.
- Enable shared keys only after the account and quota path is verified.
- Add provider spend alerts, Vercel firewall rules, and abuse response procedures.
- Record counters without logging prompts, keys, recovery codes, or plaintext projects.

## Web protections

Excalidraw fonts are copied from the installed package to
`public/excalidraw/fonts` before development and production builds. The board
sets the package's asset path to `/excalidraw/`, keeping font requests on the
same origin. Excalidraw also appends a CDN fallback to every FontFace source
list; Chromium checks it when parsing the source. CSP permits only the pinned
`https://esm.sh/@excalidraw/excalidraw@0.18.1/dist/prod/fonts/` directory in
`font-src`. General CDN connections are not enabled. Revisit that pin when
upgrading Excalidraw. Generated local assets are not committed.

Sketchcast sends baseline content-type, frame, referrer, permissions, transport,
and an enforced nonce-based Content Security Policy. The request proxy generates
a new nonce per page request; Next.js attaches it to framework scripts. The policy
uses `strict-dynamic`, blocks plugins and framing, and permits the blob workers and
media URLs required by Excalidraw and browser recording. When Clerk is configured,
its exact frontend API origin is derived from the public publishable key and added
to `connect-src`; Cloudflare's challenge frame and Clerk-hosted images are pinned
explicitly. Production does not allow `unsafe-eval`.

API request bodies are read through streaming byte limits rather than trusting
`Content-Length` alone. Production firewall rules separately rate-limit sync,
AI generation, transcription, and customer-created billing sessions by IP;
Stripe's signed webhook endpoint is intentionally excluded from those customer
limits.

## Dependency handling

`npm run audit:all` blocks high and critical advisories including contributor
tooling; `npm run audit:release` checks production dependencies only. CI also
runs lint, standalone typechecking, tests, and a production build. Dependabot and CodeQL provide ongoing
review after publication.

Do not use `npm audit fix --force` without reviewing every proposed version
change. A scanner-clearing downgrade can create a larger compatibility or
security problem.

The current brace-pattern dependency uses an exact, source-reviewed third-party
patch with bounded parsing and recursive traversal. Both installed consumers
are checked by regression tests. Its provenance, remaining resource limits,
and retirement criteria are recorded in
[Dependency replacements](DEPENDENCY-REPLACEMENTS.md). Monitor the original
upstream advisory as well as the fork; a renamed package's clean audit does
not establish coverage for future upstream vulnerabilities.
