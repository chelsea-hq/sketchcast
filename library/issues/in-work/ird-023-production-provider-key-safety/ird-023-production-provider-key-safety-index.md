---
id: ird-023
github_issue: https://github.com/chelsea-hq/sketchcast/issues/23
title: Fail closed when sandbox provider keys are used in production
status: in-work
opened: 2026-08-08
---

# IRD 023: Fail closed when sandbox provider keys are used in production

## Incident

The hosted Vercel environments contain Clerk development credentials and
Stripe test credentials. Sketchcast previously treated any non-empty keys as
configured, so a production build loaded Clerk's development instance and
could advertise sandbox billing as launch-ready.

The local-first studio remains safe and usable, but hosted auth and payments
must not activate in Production until their provider credentials are live.

## Reproduction

1. Configure `pk_test_` / `sk_test_` Clerk credentials and an `sk_test_`
   Stripe secret in a production build.
2. Open the deployed app.
3. Observe Clerk's development-instance warning and configured account/billing
   state.

Expected result: sandbox credentials work in local development but fail closed
in production. The Community studio stays available, while Creator Cloud auth,
checkout, portal, and webhook paths remain unavailable.

## Fix

- Centralize provider environment validation.
- Require Clerk `pk_live_` and `sk_live_` credentials in production.
- Require a Stripe `sk_live_` credential in production.
- Keep development and test builds compatible with sandbox credentials.
- Route Clerk CSP, middleware, provider, pages, account state, billing clients,
  and webhooks through the same fail-closed checks.

## Verification

- `npm test -- lib/provider-environment.test.ts`
- `npm run check`
- `npm run audit:release`
- Deploy with sandbox provider credentials and confirm `/api/account` reports
  auth and billing unavailable.
- Confirm the hosted studio remains available without a Clerk warning.
