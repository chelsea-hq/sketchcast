---
id: ird-020
github_issue: https://github.com/chelsea-hq/sketchcast/issues/20
title: Clear high-severity production dependency advisories
status: in-work
opened: 2026-08-08
---

# IRD 020: Clear high-severity production dependency advisories

## Incident

The 2026-08-08 production audit reports three high-severity advisories in the
installed Next.js 16.2.10 dependency chain (Next.js, PostCSS, and Sharp), plus
moderate advisories in DOMPurify, Mermaid, and Undici.

## Reproduction

```bash
npm run audit:release
```

Actual result: `6 vulnerabilities (3 moderate, 3 high)` and a failing release
gate. The audit identifies Next.js 16.3.0 as the safe stable upgrade target.

Expected result: no high or critical production advisories and an exit code of
zero from the release audit.

## Scope and risk

- Upgrade `next` and `eslint-config-next` together to stable 16.3.x.
- Refresh the lockfile and safe transitive dependencies needed to clear the
  DOMPurify, Mermaid, PostCSS, Sharp, and Undici advisories.
- Do not use a forced downgrade or accept a major dependency regression merely
  to silence the scanner.
- Preserve Proxy/CSP behavior, App Router rendering, local-first storage, API
  request guards, and deployment runtime behavior.

## Verification

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run audit:release`
- Existing CSP, API guard, sync, entitlements, and recovery tests remain green.
- Landing, studio, and account routes load in a production preview.
