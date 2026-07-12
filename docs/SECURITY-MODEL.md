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
`SKETCHCAST_ALLOW_SERVER_KEYS=true`. A public host that enables shared keys must
add authentication, durable rate limits, per-user quotas, and cost monitoring.

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
durable rate limit for `/api/sync` and monitor storage and egress. The in-memory
application limit is only a local backstop.

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

- Add managed authentication.
- Associate requests with a user or workspace.
- Enforce durable per-user and global limits.
- Record usage without logging prompts, keys, recovery codes, or plaintext
  project data.
- Add billing and abuse response procedures before enabling shared keys.

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
