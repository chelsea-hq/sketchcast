---
id: ird-032
title: Reject failed recordings without saving partial takes
status: completed
created: 2026-10-16
---

# Failed recording results

Parent: [PRD 005](../prd-005-community-project-toolkit/prd-005-community-project-toolkit-index.md).

## Defect

An asynchronous MediaRecorder error was not handled. Its subsequent
dataavailable and stop events could report a partial or empty recording as a
successful take. The expected browser ordering is documented in the
[MediaStream Recording specification](https://w3c.github.io/mediacapture-record/#error-handling).

## Acceptance

- A failed take invokes a dedicated error callback once and never invokes the
  success callback, including after late or repeated data/stop/error events.
- Partial chunks are discarded, the recorder's canvas capture tracks stop,
  animation frames stop, and the live session microphone remains available.
- A subsequent take can start and finish without stale events affecting it.
- Studio displays an actionable failure, returns to idle, and saves no take.
- Successful recording, final chunk delivery, and paused-duration calculation
  retain their existing behavior.

## Verification checkpoint

Checkout: `/Users/chelsea/Projects/sketchcast`, branch
`codex/open-source-readiness`, base commit `72f2d17`.

Three new deterministic regressions failed against the original recorder:
the error path saved partial/empty takes, a new take remained blocked, and no
error callback ran. Evidence:
`output/verification-2026-10-16/recorder-error-before.log`.

All ten recorder lifecycle tests now pass, including the three new regression
cases and an active-encoder error case. The latter independently failed before
explicit termination was added, then passed; see
`output/verification-2026-10-16/recorder-active-error-before.log`. Targeted ESLint and whitespace validation pass. Evidence:
`output/verification-2026-10-16/recorder-error-after.log` and
`output/verification-2026-10-16/recorder-error-lint.log`.

The recorder specialist owns `lib/recorder.ts` and
`lib/recorder-lifecycle.test.ts`; the orchestrator owns Studio integration and
its component regression. Final Security, Quality, build, and browser evidence
remain part of the parent release gate.


## Release candidate gate

The final local candidate passed lint, strict typecheck, 184 tests across 24
files, production build, and five Chromium workflows, including decoded
1920 × 1080 recording playback and the synthetic recording-error path.
[Security cleared the final delta](../ird-031-project-home-readiness/reports/security-2026-10-16.md)
before [independent Quality passed](qa/2026-10-16-qa-report.md).
Hosted verification and production promotion remain separate release steps.


## Production completion, October 16, 2026

Shipped in [PR 44](https://github.com/chelsea-hq/sketchcast/pull/44), merge
`94a4a8d45db89a907f38dd433eb926fe664023d6`, with deployed application source
`9b7f8b165cdcdffbf7ee7b55a36bfe59d704a997`. The production Community workflows
passed after promotion. Earlier local checkpoints above remain historical.
See the [production release record](../prd-005-community-project-toolkit/reports/production-release-2026-10-16.md)
for exact deployment, checks, rollback, and remaining limits.
