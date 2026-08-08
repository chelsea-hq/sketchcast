---
id: prd-002
title: Low-barrier Creator Cloud pricing
status: in-work
owner: Chelsea Hulin
created: 2026-08-08
---

# PRD 002: Low-barrier Creator Cloud pricing

## Objective

Make the first paid Sketchcast offer feel easy to try while preserving a useful
free, open-source Community edition and keeping every hosted cost fail-closed.

## Product decision

Launch with two plans only:

- Community remains free forever and includes the complete local-first studio,
  local projects and recovery, exports, three saved layouts, and bring-your-own
  provider keys.
- Creator Cloud costs `$5/month` or `$39/year`. Monthly is the default display;
  annual is presented as `$3.25/month, billed $39 yearly` so the commitment is
  unmistakable.

Do not advertise a Pro tier until its hosted sharing, analytics, and brand
features exist. Retire the previous `$9/month`, `$79/year`, and founding-price
presentation.

## Creator Cloud allowance

An active Creator subscription includes:

- 30 managed AI generations per UTC month;
- 60 managed transcription minutes per UTC month;
- encrypted project sync when the host has explicitly enabled and secured it;
- unlimited reusable layouts;
- unlimited bring-your-own-key use that does not consume hosted allowance.

These are account allowances, not promises that a self-hosted fork will fund
providers. Deployment-wide ceilings and provider spend controls remain in force.

## Requirements

- Keep recording, editing, exports, local storage, Recovery Vault, offline
  templates, and BYOK access in Community.
- Default the pricing control to monthly and use plain billing-period language.
- Keep the checkout request limited to a server-owned monthly or annual Price ID.
- Before creating a Stripe Checkout Session, verify that the configured Price is
  active, USD-denominated, recurring at the expected interval, and exactly
  `$5/month` or `$39/year`.
- If Stripe contains an old or mismatched Price, reject checkout without creating
  a session and tell the operator the billing price needs updating.
- Keep production checkout unavailable when live Clerk, live Stripe, webhook,
  durable quota storage, or canonical application URL configuration is missing.
- Remove founding-price claims and configuration from the active product path.
- Update public setup documentation and examples to match the new offer.

## Acceptance criteria

- Pricing initially renders `$5 / month` and offers `$3.25 / month` with
  `$39 billed yearly` after selecting Yearly.
- The annual control states the `$21` annual savings relative to 12 monthly
  payments.
- Creator Cloud feature copy states 30 managed AI actions and 60 transcription
  minutes per month without implying unlimited host-funded usage.
- Unit tests cover both price presentations, allowances, accepted Stripe Prices,
  and fail-closed mismatches.
- Lint, Vitest, `tsc --noEmit`, the Next.js production build, and the release
  dependency audit pass.
- A Vercel Preview passes landing-page price-toggle checks at desktop and mobile
  width with no unexpected console errors.
- Only the verified Preview artifact may be promoted to Production after the
  branch is merged to `main`.

## Out of scope

- Activating live payments or accepting Stripe/Clerk legal terms for the owner.
- Enabling shared provider keys or encrypted sync.
- Building or charging for a future Pro tier.
- Uploading recordings or private project plaintext.
