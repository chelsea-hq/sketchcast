# Community release checklist

Use the exact candidate source in a fresh browser profile and synthetic content.
Record revision/local changes, OS, browser/version, viewport, server URL, mode,
and results. Leave untested boxes unchecked. Local QA, preview, and production
are separate evidence layers.

The [October 16 local handoff](../library/requirements/completed/prd-005-community-project-toolkit/reports/handoff-2026-10-16.md)
records the exact replacement candidate, 177 unit/component tests, four
production-mode Chromium workflows, screenshots, and downloaded recording.
The source/config fingerprints bind that evidence to the tested implementation.

**Dependency status, October 16, 2026:** full and production audit gates pass,
each with 0 critical, high, or moderate findings and 4 low affected package
records in the KaTeX family. The [replacement guide](DEPENDENCY-REPLACEMENTS.md)
describes the exact fork, source verification, remaining limits, and monitoring.
No advisory is suppressed. The replacement candidate passed frozen installation,
lint, typechecking, 177 unit/component tests including all 17 dependency
contracts, the production build, and four production-mode Chromium workflows.
Independent Security and Quality passed the reviewed local scope, followed by
a completed local repository hygiene review. Remote CI and production Community checks subsequently passed; see the
[production release record](../library/requirements/completed/prd-005-community-project-toolkit/reports/production-release-2026-10-16.md).
Unchecked device and optional service checks below remain unverified.

Use the remaining checklist for candidate acceptance, manual device checks,
hosted-service checks, and release approval. Unchecked items are tasks, not
claims of a pass. Local audit or test success does not authorize publication.

## Clean install

- [x] New source directory, with no `.env.local`, `.next`, dependencies, or personal notes copied over.
- [ ] Retain the Node 22 frozen-install, `npm run check`, and both audit results for the exact release candidate; rerun if source or dependencies change.
- [ ] Production server: `/studio` works with no hosted accounts or provider keys.
- [ ] Landing and studio: no unexpected console errors or horizontal overflow.
- [ ] Board fonts load from the same origin without CSP errors.

## Automated browser checks

Follow the [contributor browser setup](../CONTRIBUTING.md#run-browser-checks).
These commands use the project's pinned Playwright version:

```bash
PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium
npm run test:e2e
```

The suite starts a dedicated server on port 3338 and uses fresh browser contexts
with synthetic content. It clears the test server's optional hosted-service
settings and blocks third-party browser requests. Keep that port available.

- [ ] Development-mode Chromium suite passes on the candidate.
- [ ] Retain production-mode Chromium evidence for the exact candidate. After changes, build without `.env.local` or hosted-service build configuration, then run `SKETCHCAST_E2E_PRODUCTION=1 npm run test:e2e` against that build.
- [ ] Review generated screenshots, traces, and downloaded media under `output/playwright/`; check actual board content and playback, not just file size.
- [ ] Record results with the tested revision and environment. Browser tests do not replace real camera/microphone or deployed-host checks.

## Projects, starters, and files

- [ ] Open each of the three teaching starters; confirm its editable board, sample script, and actual preview.
- [ ] Edit a starter, return home, and open the starter again; the original example is unchanged and a new project is created.
- [ ] Search and sort projects, including a search with no results and an empty board preview.
- [ ] Edit a board/script, return home, duplicate it, and verify both independent projects after reload.
- [ ] Reload on project home, create a blank project, and verify the earlier board and script are preserved.
- [ ] Download a project with a supported embedded raster image and import it in a fresh browser context; compare the board, image, script, format, and webcam layout.
- [ ] Import into a browser that already has projects; preserve those projects and create a new ID even when names match.
- [ ] Confirm exports exclude recordings, provider keys, recovery codes, cloud identifiers, and account state; explain that files are unencrypted.
- [ ] Reject malformed JSON, unsupported versions/types/images, missing images, and files over 10 MiB without adding or replacing a project.
- [ ] Verify element links and unsupported metadata are removed during transfer; review the [supported format](PROJECT-FILES.md#format-and-limits).
- [ ] Simulate a storage write failure during import/duplication; report the error without claiming a successful save.

## Desktop creator loop

- [ ] Create a named project; generate a no-key template diagram and use its script.
- [ ] Position the diagram in the recorded area; enable the prompter.
- [ ] Open preflight, start/cancel countdown, then record board-only.
- [ ] Pause, resume, stop, and wait for local-save confirmation.
- [ ] Play and download the take. Verify actual board content, expected aspect ratio, and exclusion of the prompter/tool panels.
- [ ] Reload and verify exact script, diagram, and playable take recovery.
- [ ] Make a manual edit, export at another ratio, and verify playback, dimensions, duration, and download.
- [ ] Record another take and verify capture resources stop after each recording.

## Resilience and accessibility

- [ ] Deny camera/mic permission; board-only recording remains available.
- [ ] Test actual camera + microphone audio in the downloaded video.
- [ ] Toggle devices, stop while paused, record again, and end the device session.
- [ ] Block IndexedDB and exhaust storage quota; never show a false saved/ready state.
- [ ] Delete a take during save; it stays deleted after reload.
- [ ] Cancel an export and confirm resources stop and the studio remains usable.
- [ ] On mobile width, create/open a project and edit its script without horizontal overflow; recording guidance stays desktop-only.
- [ ] Check keyboard focus and Escape behavior through all dialogs.

## Network and hosting

- [ ] No-key generation calls the Sketchcast server and returns templates without AI provider access.
- [ ] Unconfigured hosted sync/funded services remain disabled.
- [ ] Separately verify BYOK success/failure with an authorized test key and no credential logging.
- [ ] Audio is sent for transcription only after an explicit request.
- [ ] Verify durable rate limits on the actual host; repo docs do not establish deployment configuration.

## Release

- [x] October 16 local candidate: Security completed first, followed by passing Quality reports for PRD 005 / IRD 029 / IRD 030 and local repository hygiene review. Re-evaluate relevant changes before release.
- [x] Review history for secrets/private material and asset/license provenance.
- [ ] Verify current screenshots and a short demo with synthetic content.
- [x] Verify the deployment preview's exact URL and revision.
- [x] Obtain maintainer approval for merge/publication.
- [x] Verify production after release and document remaining limitations.
