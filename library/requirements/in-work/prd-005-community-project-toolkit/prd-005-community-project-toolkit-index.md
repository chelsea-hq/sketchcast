---
id: prd-005
title: Community project toolkit
status: in-work
owner: Chelsea Hulin
created: 2026-10-15
---

# Community project toolkit

## Objective and authorization

Chelsea requested modernization and useful open-source features, including use
of Wasp skills and agents. This slice makes the account-free creator workflow
portable, easier to start, and safer to maintain. Chelsea authorized production release on October 16, 2026. Provider spending
and unrelated account or infrastructure changes remain outside this release.

## Current checkout

Branch `codex/open-source-readiness`, initial base `40c3466`. PRD 004 work
predates this session and is preserved. Private knowledge and notes are excluded
from the public release. Preservation receipts remain in the local handoff.

## Acceptance

1. Download a versioned `.sketchcast` project file containing board, embedded
   images, script, output format, and webcam layout. Explicitly exclude takes,
   provider keys, recovery codes, cloud identifiers, and account state. Explain
   that the file is unencrypted and recordings must be downloaded separately.
2. Import a validated file as a new independent local project, preserving all
   existing projects. Reject malformed/oversized/unsupported data before writing.
   Import, duplicate, and export work without accounts, keys, or network calls.
3. Offer three original teaching starters with editable boards and scripts.
   Starting an example always creates a separate project. Show actual board
   previews and meaningful empty states on project home.
4. Preserve unsaved/current board contents across home, duplicate, import, and
   reload-to-create transitions. Surface persistence failures without claiming
   success. Regression tests must reproduce confirmed defects before fixes.
5. Update dependencies using compatible, reviewed security fixes. Chelsea
   authorized the temporary reviewed replacement in IRD 030 on October 16. Record remaining
   advisories honestly with reachability and remediation limits; never use a
   forced downgrade or weaken audit severity to obtain a pass.
6. Pass lint, typecheck, Vitest, production build, and browser UAT on isolated
   synthetic data. Verify import/export roundtrip, starters, duplication,
   preserved boards, rejected files, responsive layout, and board-only recording.
7. Update contributor/user documentation, roadmap, and changelog. Perform
   Security review before independent Quality review against this PRD.

## Ownership

- Parent: PRD/IRD, Studio integration, project home UI and previews, browser
  evidence, docs and final reconciliation.
- Dependency agent: initial read-only audit; changes assigned separately.
- Toolkit agent: project-file validation/serialization, starter data, unit tests.

## Limits

No new hosted services, pricing changes, real user data migration, provider
requests, full cross-browser certification, or unrelated redesign. File transfer
is a project backup, not a recording archive or encrypted cloud-sync replacement.

## Current checkpoint

2026-10-16: implementation and dependency remediation are complete locally.
The reviewed, exactly pinned brace-pattern replacement resolves the earlier
High blocker. Both audits pass at their original threshold; the Low KaTeX
family remains documented with a review date of October 22.

Lint, strict typecheck, 177 unit/component tests in 24 files, and production
build pass on the final dependency graph. All four production Chromium flows
pass, including manual editing, preservation, fresh-context project transfer,
mobile/modal behavior, and a downloaded recording with decoded playback proof.
All 124 recorded source/config hashes match the tested source candidate.

[Security cleared this scope](reports/security-2026-10-16.md) before independent
Quality started. [Quality passed all seven acceptance criteria](qa/2026-10-16-qa-report.md),
with zero open findings. The subsequent
[local Repository Health review](reports/repository-health-2026-10-16.md) is
complete, with maintenance recommendations and remote coverage gaps recorded. The [current handoff](reports/handoff-2026-10-16.md) contains exact
checkout, owned files, receipts, preservation, and release limitations.
The [October 15 handoff](reports/handoff-2026-10-15.md) retains the earlier
blocked state and initial implementation evidence as history.

Release authorization followed local acceptance. Commit `72f2d17` was pushed
as [PR 44](https://github.com/chelsea-hq/sketchcast/pull/44); CI and CodeQL passed.
Hosted checks then exposed the canvas-readiness race in [IRD 031](../ird-031-project-home-readiness/ird-031-project-home-readiness-index.md).
PR review also identified the recorder failure path addressed in [IRD 032](../ird-032-recorder-error-result/ird-032-recorder-error-result-index.md).
These bounded deltas receive new Security and Quality checks before promotion.
The primary production alias remains on the previous release at this checkpoint.
