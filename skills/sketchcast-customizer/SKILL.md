---
name: sketchcast-customizer
description: Customize a Sketchcast fork into a branded creator recording dashboard while preserving local-first, BYOK, privacy, and deployment safety defaults.
---

# Sketchcast Customizer

Use this skill when someone wants to rebrand, simplify, extend, or deploy a
Sketchcast fork as their own creator dashboard.

## First checks

1. Read `AGENTS.md`, `README.md`, `SECURITY.md`, and
   `docs/SECURITY-MODEL.md` completely.
2. Read the relevant local Next.js guide under `node_modules/next/dist/docs/`
   before changing Next.js code or configuration.
3. Inspect the existing implementation before proposing new architecture.
4. Confirm the audience, brand, must-keep workflow, and hosting profile.

## Safe defaults

- Keep the app local-first and usable without an account.
- Keep server-funded keys off unless the user explicitly approves a hosted
  paid-service architecture.
- Keep cloud sync off unless private storage and durable platform limits exist.
- Never print, log, commit, or move provider keys into client code.
- Do not add analytics, uploads, billing, or authentication without explaining
  the new data flow and getting approval.
- Preserve offline fallbacks, request body caps, origin checks, log redaction,
  recovery-code encryption, nonce CSP, and security headers.
- If Creator Cloud is retained, preserve signature-verified Stripe webhooks,
  server-owned Price IDs, active-subscription checks, atomic per-user and global
  quotas, and production firewall limits.

## Customization workflow

1. Write a short change brief with the product name, audience, visual system,
   navigation, retained features, removed features, and any new data flow.
2. Prefer adapting existing components and tokens over replacing the stack.
3. Keep recording, project recovery, and export behavior stable unless they are
   explicitly in scope.
4. Update README and security documentation for new environment variables or
   third-party services.
5. Add tests for behavior and trust-boundary changes.

## Choosing a hosting profile

- For a branded personal dashboard or public fork, keep Community mode: no
  account requirement, BYOK, local Recovery Vault, and optional self-hosted sync.
- For a paid hosted service, follow `docs/CREATOR-CLOUD-SETUP.md`. Do not enable
  host-funded keys until Clerk, Stripe, Upstash, the signed webhook, both quota
  layers, and firewall rules have been verified together.
- Never use a client-side plan flag or editable Stripe Price ID as an entitlement.

## Required verification

Run:

```bash
npm run lint
npm test
npm run build
npm run audit:release
```

Then verify the landing page and studio in a real browser. For recording
changes, complete a short camera and microphone recording and export. Report
local build, browser verification, deployment, and production behavior as
separate proof layers.

## Stop conditions

Stop and ask before enabling shared credentials, making a private repository
public, purchasing infrastructure, changing account permissions, or deploying
data-flow changes that were not in the approved brief.
