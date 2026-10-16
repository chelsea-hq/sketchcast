# Sketchcast open-source readiness, 2026-09-05

## Verdict

Sketchcast is already public and MIT-licensed. The strongest release proposition
is the free, local-first creator studio; optional hosted services should have a
separate launch. This pass materially improves local readiness, but is not a
production release or a complete security/accessibility certification.

Work is local and uncommitted on `codex/open-source-readiness`, based on
`40c3466`. No push, PR publication, merge, deployment, account setup, provider
spend, or announcement occurred. Existing untracked knowledge/notes were not
edited or included in the clean source candidate.

## Fixed and verified

| Finding | Change | Evidence |
| --- | --- | --- |
| Recording frame stays at 960×540 after project home, clipping footage | `components/useRecordingFrame.ts:12` attaches the observer when the canvas becomes active | Two lifecycle assertions failed before the dependency fix; three now pass. Corrected 1920×1080 download visually contains the complete diagram |
| Capture tracks remain alive after stopping/failed startup | `lib/recorder.ts:128` releases owned video tracks while retaining borrowed microphone audio | Six failing-before/passing-after regressions cover stop, constructor/start failure, duplicate start, another take, and pause duration |
| Board font fallback violates CSP on mount | Prepare local fonts, initialize their asset path from the studio route, and allow only the exact installed CDN font directory | Baseline produced roughly 190 font errors. Final board open, capture, and export produced no new unexpected console entries. Local font HTTP request returns 200 |
| Failed IndexedDB initialization claims the vault is ready | `components/Studio.tsx` keeps recovery unavailable; `components/CreatorHome.tsx:119` shows guidance and retry | Component regression plus an isolated browser throwing a synthetic SecurityError. Persistent alert appeared, creation stayed disabled, retry opened the vault after the simulated failure was removed |
| Contributor tooling has a high advisory outside the production audit | Update Browserslist 4.28.4 → 4.28.9 and its compatible data dependencies; run `audit:all` in CI | Full audit fails before refresh and reports zero afterward; production-only audit also reports zero |
| Newcomer instructions do not match current UI/security behavior | Rewrite README, environment comments, contributor guide; add Node selection, roadmap and release checklist | Four-command quickstart, real screenshot, valid local links, three live badges, no environment file required |

## Automated verification

A new source directory was populated with tracked files plus the explicit new
candidate files. No `.env.local`, build output, node_modules, personal notes,
browser state, or private user content was copied. Configuration variable names
from `.env.example` were removed from the test subprocess environment.

- Node 22.22.3, npm 10.9.8; Node minimum is now 22.22.2 within the 22.x line
  because the new jsdom test environment requires it. `.nvmrc` and CI select 22.
- `npm ci`: pass using the updated lockfile.
- ESLint and `next typegen && tsc --noEmit`: pass.
- Vitest: **71 tests across 20 files pass** (baseline: 57 across 16).
- Next.js 16.3.0 production webpack build: pass without an environment file.
- `npm run audit:all` and `npm run audit:release`: **zero vulnerabilities**.
- `git diff --check`: pass.
- Gitleaks, fully redacted: **zero findings across 34 locally reachable commits**
  and zero findings in the current candidate source snapshot. This is scanner
  evidence, not a guarantee about all historical private material or provenance.

Fresh npm installation reports existing React peer-range warnings from older
Radix packages nested under Excalidraw. Installation, typecheck, tests, build,
and the browser paths below succeed. Do not suppress those warnings with a
forced dependency downgrade; review compatibility in a dedicated upgrade.

## Browser and media evidence

Local production server: `http://127.0.0.1:3338/studio`, running the clean source
candidate, separate from the main checkout's build. Test browser: Chromium 151
on macOS, isolated profile; desktop 1440×1000 and mobile viewport 390×844.
Only synthetic project content was used. No real camera/mic or provider key was
requested.

Passed:

- Project home → named project → no-key template generation → diagram insertion
  and matching script; board and exact generated script restored after reload.
- Recording preflight, board-only recording, pause/resume, Stop & save, local
  recovery confirmation, playback, and actual file download.
- Manual cut removing the first two seconds, then square export and download.
  ffprobe confirms original H.264 at 1920×1080 / 17.817s and exported H.264 at
  1080×1080 / 15.818s. This export was tested before the final crop-hook fix;
  editor/export implementation did not change in that final fix.
- Capture repeated after the final crop fix: downloaded H.264 at 1920×1080 /
  34.842s. Playback inspection confirms the entire diagram is present and the
  prompter and tool panels are absent. A previous download visibly reproduced
  the clipped-diagram defect.
- Reload restores saved original/exported takes and correct project take counts.
- Record again → countdown → Cancel returns safely without another take.
- Mobile project creation and script editing, with desktop-recording guidance
  and no horizontal overflow. Desktop overflow check also passes.
- Synthetic IndexedDB initialization failure and successful reload retry.

Screenshots and synthetic video evidence are in gitignored `output/playwright/`.
The reviewed README image is `docs/images/community-studio.png`. Console logs
retain earlier baseline failures; there were no new unexpected errors after the
final font-policy correction (the main session log remained at 460 earlier lines).

## README audit and validation

Initial audit:

| Area | Baseline | Resolution |
| --- | --- | --- |
| Product purpose and features | Useful and specific | Retained and focused on Community |
| Badges | Present | Pinned workflows to main; checked all three URLs |
| Quickstart | Missing clone/Node and current first-run UI | Complete four-command setup plus expected screen |
| Provider setup | Implies local server keys work without hosted entitlement | Corrected to studio BYOK; documented full managed prerequisites |
| Privacy | Overstates offline/browser-only behavior | Distinguishes server template calls, BYOK, transcription, sync |
| License and contribution path | License file and guide exist | Explicit license line, code map, roadmap, verification steps |

Completed README skill checklist:

| # | Check | Status |
| --- | --- | --- |
| 1 | Title | Pass |
| 2 | One-sentence tagline | Pass |
| 3 | Three status/license badges | Pass |
| 4 | Badge URLs return 200; CI/CodeQL report passing on main, license MIT | Pass |
| 5 | Four-command quickstart and expected result | Pass |
| 6 | Node/npm/Git prerequisites and installation | Pass |
| 7 | Runnable production/check examples plus UI recording walkthrough | Pass |
| 8 | Product-first order; quickstart before screenshot so setup stays immediate | Pass |
| 9 | No oversized prose section | Pass |
| 10 | Under 1,500 words | Pass |
| 11 | Contribution guide and roadmap links | Pass |
| 12 | Explicit MIT license line | Pass |

## Remaining before a wider launch

1. Verify real camera/microphone footage, denied permissions, device toggles,
   repeated device sessions, and recording in supported browsers on real devices.
2. Test storage quota exhaustion, long recordings, export cancellation, and the
   larger keyboard/accessibility matrix in `docs/RELEASE-CHECKLIST.md`.
3. Review distributed assets, font notices, and source/license provenance.
   The MIT license and Gitleaks result do not replace that review.
4. Improve example diagrams, project thumbnails, current landing-page imagery,
   and provider error explanations. Validate available models before changing
   defaults; this pass did not wire Astra or spend provider credits.
5. Verify an approved deployed preview and then production on the exact release.
   Hosted configuration, firewall, billing and quota behavior were not inspected
   on a live deployment in this pass.

Recommended next milestone: a small Community pilot using the checklist and
real creator recordings, then a wider announcement once those results are clear.
