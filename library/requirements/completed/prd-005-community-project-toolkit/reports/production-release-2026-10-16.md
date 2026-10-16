# Sketchcast production release, October 16, 2026

**Live:** <https://sketchcast-silk.vercel.app/studio>.
Chelsea explicitly authorized production publication. The Community toolkit,
dependency replacement, and release fixes are committed, pushed, merged and
verified on production. Private notes, environment files and generated user
content were excluded.

## Release identity

- [PR 44](https://github.com/chelsea-hq/sketchcast/pull/44) merged locally with a
  merge commit, then pushed to `main`: `94a4a8d45db89a907f38dd433eb926fe664023d6`.
- Deployed source: `9b7f8b165cdcdffbf7ee7b55a36bfe59d704a997`. The merge tree was
  verified identical to this source. Subsequent release-record changes affect
  documentation only; they do not replace the tested application artifact.
- Vercel deployment: `dpl_DYuy6M6wHYo5xf54jfWe1MQyAm75`, **READY**, Node 22.x.
  [Immutable deployment](https://sketchcast-aa0ih08tg-chelseas-projects-0c4481d6.vercel.app).
- Vercel deployment metadata records the same Git commit. Its production target,
  configured `sketchcast-silk.vercel.app` domain and team alias resolve to it.
  The older personal preview alias remains on its previous deployment.
- Existing Vercel environment settings were preserved. No Git auto-deployment
  integration, new paid service, database migration or provider opt-in was added.

## Verified evidence

| Layer | Result |
| --- | --- |
| Final local checks | Lint, strict typecheck, 184 tests across 24 files, production build passed. |
| Source identity | All 124 application/test/config fingerprints match the isolated final build. |
| Security, then Quality | Original scope cleared; new IRD031/032 delta cleared before independent QA. Zero open delta findings. |
| Independent failure probes | Delayed/rejected project reads with late canvas API, preserved pending scene, failed-save readiness, and 10 recorder lifecycle tests passed. |
| Repository review | Explicit file selection, clean whitespace, source identity and preserved private work checked after QA. |
| Secret scans | Earlier 27-commit history scan clean; final five changed code/test files clean. Initial snapshot matches on hashes/prose were individually identified as false positives. |
| PR CI | [CI passed](https://github.com/chelsea-hq/sketchcast/actions/runs/38961938243), including all five Chromium flows and the full dependency gate. [CodeQL passed](https://github.com/chelsea-hq/sketchcast/actions/runs/38961938087). |
| Main merge CI | [CI passed](https://github.com/chelsea-hq/sketchcast/actions/runs/38962246255) and [CodeQL passed](https://github.com/chelsea-hq/sketchcast/actions/runs/38962246259) on merge `94a4a8d`. |
| Vercel build | Passed on deployed source, with existing production configuration. |
| Staged hosted browser | All five workflows passed in 20.6 seconds, no retries. |
| Production browser | All five workflows passed in 17.8 seconds, no retries. |
| Deployed HTTP | Landing, studio and account returned 200; CSP present with distinct per-request nonces, no unsafe-eval, frame-ancestors none, HSTS and nosniff. |
| Runtime log sample | No error-level entries returned for this deployment during the first ten-minute release window query. This is a bounded sample, not an uptime guarantee. |

Browser checks used fresh Chromium profiles and synthetic content. They covered
starter editing, previews, duplication, reload/create preservation, portable
project transfer with an embedded PNG, malformed-file rejection, mobile/dialog
behavior, and a real board-only recording with decoded 1920 × 1080 playback.
The fifth test injected a synthetic MediaRecorder error and confirmed idle UI,
no downloadable partial result and zero saved takes. It does not simulate every
physical encoder/device failure. Same-origin API mutations were blocked in the
hosted harness; no paid provider, checkout or sync write was exercised.

The first hosted candidate exposed a quick-return canvas readiness race and
was not promoted to the primary domain. IRD031 records the deterministic
reproduction and fix. PR review identified a separate recorder error path,
addressed in IRD032. Both fixes passed a new Security → Quality cycle before
this final artifact was built. CodeRabbit's automatic re-review was rate
limited; independent delta reviews provided the final assessment.

Local receipts remain under `output/verification-2026-10-16/`, including
`vercel-final-deployment.json`, `production-aliases.json`,
`hosted-browser-final-staged.log`, `hosted-browser-production.log`,
`hosted-http-production.json`, `release-final-check.log`, failure traces and
independent Quality probes. These synthetic artifacts are ignored by Git.
The [release source fingerprints](release-source-fingerprints-2026-10-16.json)
bind checks to the deployed code. Earlier manifests and reports are historical;
the completed-folder move changes documentation paths only.

## Remaining limits and maintenance

- Four Low affected package records in one KaTeX advisory family remain tracked
  for maintainer review by October 22, 2026. Full and production audit gates
  reported zero Critical/High/Moderate. The pinned braces replacement still
  requires upstream monitoring, as described in the
  [dependency guide](../../../../../docs/DEPENDENCY-REPLACEMENTS.md).
- Real camera/microphone capture, Safari/Firefox, paid provider keys, cloud sync,
  billing and authenticated account behavior were not newly certified by this
  Community release. Existing hosted-service settings were preserved.
- Main has no active branch protection/ruleset. Existing maintainer ownership
  and PR-template recommendations remain follow-ups; no repository policy was
  changed silently.

## Rollback

Previous production deployment: `dpl_GNTYekfgFHhX4YzMDjNWytCoKCM3`,
`sketchcast-gh9cjrirz-chelseas-projects-0c4481d6.vercel.app`.
It remains available. No rollback was performed. If a confirmed production
regression requires reverting this release, the operator can promote that
known previous artifact and then verify the configured domain and creator flow:

```sh
vercel promote dpl_GNTYekfgFHhX4YzMDjNWytCoKCM3 --yes --scope team_QhFBY1ox97KHi4mPypARfa5R
```

No data migration or storage reset accompanied this release. PRD005 and
IRD029–032 are now in `completed/`; older plans retain their existing status.
