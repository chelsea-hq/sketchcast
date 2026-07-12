# Security assessment remediation

This matrix records how the July 12, 2026 public-deployment assessment maps to
the current repository. It is not a claim that software can be risk-free; it is
an auditable list of trust boundaries, controls, and verification evidence.

| Assessment area | Current control | Verification |
| --- | --- | --- |
| Paid API authentication | BYOK and offline Community requests remain public by design. A host-funded key is resolved only after Clerk identifies the caller, Upstash confirms an active Stripe subscription, and quota is reserved. The provider function itself cannot fall back to a server key. | `lib/hosted-auth.ts`, `lib/creator-cloud.ts`, `lib/ai.ts`, and regression tests in `lib/ai.test.ts` |
| Per-user and deployment cost abuse | One atomic Redis script checks and increments both the user's allowance and the host-wide monthly ceiling. Production firewall rules rate-limit AI, transcription, sync, and customer billing-session endpoints independently. | `reserveUsage()` in `lib/creator-cloud.ts`; inspect the live Vercel firewall; provider spend alerts remain an operator responsibility |
| Stripe entitlement integrity | Checkout selects server-owned Price IDs. Webhooks require Stripe signatures. Subscription writes reject older event timestamps atomically. Client plan claims are ignored. | `app/api/billing/*`, `lib/stripe.ts`, `lib/creator-cloud.ts` |
| Dependency advisories | Secure direct versions and overrides remove the reported PostCSS and Nano ID advisories without downgrading Next.js. CI blocks high and critical production advisories. | `npm run audit:release`, `package.json`, Dependabot, and the CI badge |
| Content injection and CSP | Production uses an enforced per-request nonce policy with `strict-dynamic`, exact Clerk frontend-origin derivation, no production `unsafe-eval`, no object embedding, and explicit blob media/worker allowances. All pages render dynamically so Next.js scripts receive the matching nonce. | `proxy.ts`, `lib/content-security-policy.ts`, CSP tests, and the response `Content-Security-Policy` header |
| Oversized and streamed bodies | Routes use streaming byte caps, including when `Content-Length` is absent. JSON, sync, audio, Checkout, and Stripe webhook bodies have route-specific limits. | `lib/request-body.ts`, `lib/request-body.test.ts`, and route handlers under `app/api/` |
| Browser API keys | Keys use session storage by default. Persistent device storage is explicit opt-in. Keys are forwarded only to the selected provider and are redacted from logs. | `lib/user-keys.ts`, `components/SettingsModal.tsx`, `lib/ai.ts` |
| Server secrets | Shared keys are ignored unless explicitly enabled. Hosted billing also fails closed when auth, webhook, Redis, Price IDs, or the canonical HTTPS application origin is missing. | `.env.example`, `lib/creator-cloud.ts`, `lib/app-url.ts` |
| Encrypted cloud sync | AES-GCM encryption and write capabilities are created in the browser. The server stores ciphertext only. Hosted mode can require an active Creator subscription in addition to the recovery capability. | `lib/project-sync.ts`, `lib/sync-capability.ts`, `app/api/sync/route.ts` |
| Ongoing review | CI runs lint, tests, build, and the production audit. CodeQL runs on pushes, pull requests, and weekly. Dependabot monitors npm and Actions. Private vulnerability reports use email rather than public issues. | `.github/`, `SECURITY.md`, and the status badges in `README.md` |

## Safe operating boundary

The default clone is Community mode: local-first, BYOK, no host-funded services,
and sync disabled until explicitly configured. Creator Cloud code being present
does not activate it. The hosted plan remains unavailable unless every required
service and secret is present; partial configuration resolves to Community.

Follow [Creator Cloud setup](CREATOR-CLOUD-SETUP.md) before enabling shared keys
or live Stripe mode. A real test-mode purchase, webhook, quota increment,
subscription cancellation, portal session, and paid sync remain required proof
for each new deployment.
