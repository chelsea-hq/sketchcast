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
- Upstash stores Stripe customer/subscription identifiers, subscription status,
  renewal timestamps, and monthly usage counters. It does not store prompts,
  provider keys, recordings, recovery codes, or plaintext projects.
- Atomic Redis scripts reject managed usage above the configured monthly quota.
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

Sketchcast sends baseline content-type, frame, referrer, permissions, transport,
and CSP headers. CSP begins in Report-Only mode so recording, Excalidraw, image
paste, workers, and blob media can be tested. Enforce it only after reviewing
production browser violations and removing any unnecessary source allowances.

## Dependency handling

`npm run audit:release` blocks high and critical production advisories. CI also
runs lint, tests, and a production build. Dependabot and CodeQL provide ongoing
review after publication.

Do not use `npm audit fix --force` without reviewing every proposed version
change. A scanner-clearing downgrade can create a larger compatibility or
security problem.
