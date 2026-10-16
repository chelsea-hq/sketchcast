---
id: ird-031
title: Preserve readiness when leaving an unmounted board
status: completed
created: 2026-10-16
---

# Project home readiness

Parent: [PRD 005](../prd-005-community-project-toolkit/prd-005-community-project-toolkit-index.md).
Chelsea authorized production release on October 16, 2026. Hosted verification
of commit `72f2d17` exposed a race before the primary domain was promoted.

## Defect

Opening a project sets recovery readiness false until Board delivers its API
on an animation frame. Returning to Projects first unmounts Board and cancels
that callback, leaving project actions disabled indefinitely. An initial empty
canvas change can also replace the pending saved scene before restoration.
This is a canvas lifecycle race, independent of Clerk or hosted service state.

## Acceptance

- Return to Projects before Board delivers its API; the saved project remains
  usable and readiness returns without waiting for an unmounted canvas.
- Ignore initial canvas changes until the pending project has been restored.
  Preserve its nonempty board and script through the return transition.
- A failed save keeps the user in the studio with the existing failure alert;
  do not report a successful return or ready project list.
- Complete asynchronous home reads before clearing the old canvas API so a
  delayed callback during the read cannot survive the view transition.
- Reproduce the defects with deterministic component regressions, retain the
  failed hosted trace, then pass checks and hosted browser flows. Complete
  scoped Security followed by independent Quality before release.

## Evidence

The initial hosted run passed three workflows and failed the first at its
duplicate action: the project list remained on “Opening vault”. Its trace and
screenshots are retained under `output/verification-2026-10-16/`.
The new component regressions fail before the fix for readiness and scene
preservation. Existing failure handling is covered separately.


## Release candidate gate

The final local candidate passed lint, strict typecheck, 184 tests across 24
files, production build, and five Chromium workflows, including decoded
1920 × 1080 recording playback and the synthetic recording-error path.
[Security cleared the final delta](reports/security-2026-10-16.md)
before [independent Quality passed](qa/2026-10-16-qa-report.md).
Hosted verification and production promotion remain separate release steps.


## Production completion, October 16, 2026

Shipped in [PR 44](https://github.com/chelsea-hq/sketchcast/pull/44), merge
`94a4a8d45db89a907f38dd433eb926fe664023d6`, with deployed application source
`9b7f8b165cdcdffbf7ee7b55a36bfe59d704a997`. The production Community workflows
passed after promotion. Earlier local checkpoints above remain historical.
See the [production release record](../prd-005-community-project-toolkit/reports/production-release-2026-10-16.md)
for exact deployment, checks, rollback, and remaining limits.
