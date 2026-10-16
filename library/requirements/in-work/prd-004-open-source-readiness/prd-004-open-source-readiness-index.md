---
id: prd-004
title: Open-source readiness
status: in-work
owner: Chelsea Hulin
created: 2026-09-05
---

# PRD 004: Open-source readiness

## Objective

Make the existing public, MIT-licensed Community studio easy to evaluate, run,
and contribute to. Lead with a free, account-free whiteboard-to-video workflow.
Creator Cloud remains an optional, explicitly configured hosting layer.

## Grounding

- GitHub currently reports `chelsea-hq/sketchcast` as public, MIT-licensed, with issues enabled.
- Baseline `40c3466` passes lint, 57 Vitest tests, and a production build.
- The 2026-09-05 production npm audit reports no advisories.
- README setup omits cloning, Node 22, the current project-home workflow, and
  the subscription/quota requirements for server-funded keys.
- CI relies on the production build for typechecking; contributors need a
  standalone check that generates Next route types on a fresh checkout.
- The capture lifecycle in `lib/recorder.ts` creates a canvas stream but does
  not stop its video tracks when capture ends or initialization fails.

## First reviewable slice

1. Rewrite the README around a four-command Community quickstart, a real
   current screenshot, and a first-recording walkthrough using no keys.
2. Document actual privacy boundaries: no-key diagram requests still reach the
   local/self-hosted server; BYOK prompts and transcription reach providers only
   when requested; recordings and encrypted project sync are separate paths.
3. Correct server-key instructions without changing hosted gates.
4. Add `typecheck` using `next typegen && tsc --noEmit`, include it in `check`
   and CI, and pin the existing Node 22 requirement in `.nvmrc`.
5. Repair the confirmed recorder resource leak with failing-before/passing-after
   regression tests, preserving the live session's borrowed microphone track.
6. Verify a fresh source snapshot with `npm ci`, no `.env.local`, all checks,
   and a desktop recording/review/reload/edit/export smoke test. Check mobile
   project preparation separately; do not imply mobile recording support.
7. Publish a repository-local roadmap and evidence report, distinguishing
   local results from preview, production, and any untested behavior.

## Findings incorporated in this slice

- IRD 025: copy board fonts locally and narrowly permit the installed package's
  unavoidable font fallback under CSP.
- IRD 026: show a persistent, retryable vault-initialization failure.
- IRD 027: clear a development-tooling advisory and include tooling in CI audits.
- IRD 028: observe the recorded frame when the board mounts after project home;
  the old default crop clipped real downloaded footage.

Local implementation and verification are recorded in
[the readiness report](reports/2026-09-05-readiness-report.md). Wider-release
checks remain open; this PRD is not a declaration of production readiness.

## Acceptance criteria

- A newcomer can reach the studio and produce a board-only take with no account,
  provider key, paid service, or environment file.
- Quickstart names Node 22, desktop recording expectations, the exact Studio
  URL, and what successful startup looks like.
- Documentation never promises unlimited storage, fully offline operation,
  unconfigured hosted services, or browser support that was not tested.
- Each recorder-owned capture track ends on normal stop and failed startup;
  the connected session's microphone remains usable for the next take.
- Lint, standalone typecheck, Vitest, production build, and audit pass on the
  candidate source. Browser evidence records its environment and limits.
- Existing personal notes and knowledge folders are left untouched and do not
  enter the candidate snapshot.

## Release boundary

This slice is local preparation. A public PR/push, deployment, release tag,
announcement, and merge require Chelsea's explicit approval. Hosted billing,
provider/model migrations, full storage recovery redesign, cross-browser
certification, and a full history/asset provenance audit are separate work.
