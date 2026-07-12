# Creator Cloud setup

Community mode needs none of these services. Use this checklist only when a
fork will sell host-funded AI, transcription, or encrypted sync.

## 1. Create the managed services

Provision:

- a Clerk application for identity and sessions;
- a Stripe account with Checkout and the customer portal;
- an Upstash Redis database for subscription records and usage counters;
- a private Vercel Blob store if encrypted sync is offered.

Accept provider terms and complete payment onboarding as the account owner.
Never ask an agent or contributor to accept legal terms on your behalf.

## 2. Configure prices

Create recurring Stripe Prices for:

- Creator monthly (`$9/month` in the reference product);
- Creator annual (`$79/year`);
- optional founding annual (`$49/year` while the offer is open).

Copy only the Price IDs into Vercel. The checkout route maps a small interval
enum to these server-owned IDs and never accepts an amount or arbitrary Price ID
from the browser.

## 3. Set environment variables

Use Vercel's encrypted environment variable store. The complete names are in
`.env.example`; the required hosted set is:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_CREATOR_MONTHLY
STRIPE_PRICE_CREATOR_ANNUAL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL
```

`NEXT_PUBLIC_APP_URL` must be the canonical HTTPS origin with no path, query,
or fragment. Billing remains disabled in production if that value is missing or
invalid, preventing Host-header-controlled Checkout return URLs.

Set `STRIPE_PRICE_FOUNDING_ANNUAL` only while the founding rate is available.
Some Vercel Upstash plans use the equivalent `KV_REST_API_URL` and
`KV_REST_API_TOKEN` names; Sketchcast accepts either pair.

## 4. Register the Stripe webhook

Point Stripe at:

```text
https://YOUR_DOMAIN/api/billing/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the endpoint signing secret to `STRIPE_WEBHOOK_SECRET`. Do not enable
checkout until a signed test event updates the matching Clerk user's account.

## 5. Enable funded features last

After auth, billing, Redis, webhook delivery, and firewall rules are verified,
set:

```text
SKETCHCAST_ALLOW_SERVER_KEYS=true
SKETCHCAST_REQUIRE_SYNC_SUBSCRIPTION=true
```

Add only the provider keys you intend to fund. Set provider spend alerts and
choose deployment-wide monthly ceilings with:

```text
SKETCHCAST_GLOBAL_AI_MONTHLY_LIMIT=5000
SKETCHCAST_GLOBAL_TRANSCRIPTION_SECONDS_MONTHLY_LIMIT=360000
```

The defaults are hard ceilings, not forecasts. Lower them for a small launch.

## 6. Prove the complete flow

In Stripe test mode, verify all of these before using live mode:

1. A new user can sign up and receives only Community access.
2. Checkout uses the selected server Price and returns to `/account`.
3. A verified webhook grants Creator; refreshing the browser alone cannot.
4. Managed AI increments both user and global counters atomically.
5. BYOK AI works without consuming hosted quota.
6. Managed transcription reserves the WAV duration and rejects an exceeded limit.
7. Hosted sync rejects signed-out and Community users, then works for Creator.
8. The billing portal opens only for the authenticated Stripe customer.
9. Canceling or deleting the subscription removes Creator access after the
   corresponding webhook.
10. CSP, firewall rules, CI, CodeQL, and `npm run audit:release` remain green.

Only after this test-mode story passes should the Stripe live keys, live Prices,
and live webhook secret replace their test equivalents.
