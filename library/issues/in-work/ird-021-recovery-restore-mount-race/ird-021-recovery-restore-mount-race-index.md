---
id: ird-021
github_issue: https://github.com/chelsea-hq/sketchcast/issues/21
title: Fix Recovery Vault scene restore before canvas mount
status: in-work
opened: 2026-08-08
---

# IRD 021: Fix Recovery Vault scene restore before canvas mount

## Incident

Opening `/studio` can log React's `Can't call setState on a component that is
not yet mounted` warning. The startup stack traces through
`applyTemplateScene` → `Studio.restoreProject` → `Studio.handleApiReady`.

Excalidraw provides its imperative API while its internal app is still
mounting. Sketchcast immediately restores the Recovery Vault snapshot through
that API, which asks the not-yet-mounted canvas app to update its scene.

## Reproduction

1. Open `/studio` with a Recovery Vault project in browser storage.
2. Watch the browser console during canvas startup.
3. Observe the not-yet-mounted state update warning.

Expected result: the Recovery Vault scene restores after the canvas mounts,
without a console warning or a flash of stale project data.

## Fix

- Gate Excalidraw API delivery until the Board component has mounted.
- Deliver on the next animation frame so Excalidraw has completed its own
  mount effects before Sketchcast calls `updateScene`.
- Coalesce repeated API callbacks to the latest value and cancel pending work
  if the Board unmounts.
- Cover the scheduling, replacement, and disposal behavior with a regression
  test.

## Verification

- `npm test -- lib/canvas-api-ready.test.ts`
- `npm run check`
- Open `/studio` on desktop and mobile with a stored project.
- Confirm the restored scene appears and the startup console is clean.
