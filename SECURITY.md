# Security Policy

## Supported version

Security fixes are applied to the latest commit on `main`. This project is
currently pre-1.0, so older commits and forks are not separately supported.

## Report a vulnerability

Email `easyroadup@gmail.com` with the subject `Sketchcast security report`.
Include the affected route or feature, reproduction steps, impact, and any
suggested mitigation. Do not include live credentials, private recordings, or
another person's data.

Please do not open a public issue until the report has been investigated and a
fix or disclosure plan is ready. You should receive an acknowledgement within
five business days.

## Security posture

- Sketchcast is local-first and bring-your-own-key by default.
- Server-funded AI and transcription keys require the explicit
  `SKETCHCAST_ALLOW_SERVER_KEYS=true` opt-in plus an authenticated active
  Creator subscription and available durable per-user quota.
- Cloud sync requires the explicit `SKETCHCAST_ENABLE_CLOUD_SYNC=true` opt-in,
  a private Blob store, and a durable platform rate limit.
- Project sync is encrypted in the browser. The server stores ciphertext and a
  random lookup identifier, not the recovery code or plaintext.
- Video recordings stay in browser storage unless the user exports them.
- Browser-persisted API keys are optional and should be used only on trusted
  personal devices.
- Stripe webhook signatures are verified before subscription entitlements are
  written. Checkout uses server-owned Price IDs, never browser-supplied amounts.
- If Clerk, Stripe, or Upstash is incomplete, hosted entitlements fail closed
  while the Community/BYOK product remains usable.

The complete threat model and hosting guidance are in
[docs/SECURITY-MODEL.md](docs/SECURITY-MODEL.md).

## Dependency policy

Pull requests must pass the production audit gate for high and critical
advisories. Moderate advisories are reviewed for reachability and remediated or
documented with an owner and review date. Forced dependency downgrades are not
accepted as security fixes.
