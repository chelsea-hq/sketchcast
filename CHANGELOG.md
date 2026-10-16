# Changelog

Notable changes to Sketchcast are recorded here.

## 2026-10-16

### Community project toolkit

- Download and import version 1 `.sketchcast` files containing editable boards,
  supported embedded raster images, scripts, output format, and webcam layout.
  Files are unencrypted, capped at 10 MiB, and exclude recordings, credentials,
  recovery codes, and account state. Imports create independent local projects.
- Duplicate a project without copying its recordings or sync state. File
  validation removes unsupported metadata and element links; unsupported drawing
  types and image formats are rejected. See [project-file limits](docs/PROJECT-FILES.md#format-and-limits).
- Add three original, free teaching starters: **Explain a process**,
  **Compare two ideas**, and **Teach a concept**. Each includes an editable board
  and sample script and opens as a new local project.
- Render previews from actual board content on project and starter cards, with
  search, sorting, and clear empty states.
- Preserve current board content across project-home, duplicate, import, and
  reload-to-create transitions, with regression coverage for scene loss.

### Reliability

- Keep Projects usable when returning before the board finishes loading, and
  preserve saved scenes through that transition.
- Report browser recording failures without saving a partial take; release
  capture resources and let the creator record again.
- Measure the recorded area when entering the studio from project home, so
  same-format projects do not keep a stale crop that clips the downloaded take.
- Release recorder-owned canvas tracks after stopping or failed startup while
  preserving the connected microphone for the next take.
- Show persistent storage-failure guidance and retry without claiming the
  Recovery Vault is ready when initialization failed.
- Serve board fonts locally with a narrowly pinned CDN font fallback.

### Contributor experience

- Add a Community quickstart, studio screenshot, contributor code map,
  roadmap, and browser release checklist.
- Add standalone typechecking, lifecycle/component regressions, and a full
  dependency audit in CI. Refresh the vulnerable Browserslist dependency.
- Require Node 22.22.2 or newer within Node 22 for the DOM test environment.
- Add a separate Playwright Chromium suite for Community project workflows and
  board-only recording, with isolated browser contexts and a dedicated local
  server. Production-mode checks use an existing build.
- Update Next.js and its lint configuration to 16.3.8, React and React DOM to
  19.2.8, and compatible toolchain and transitive dependencies. These are
  selected compatible updates, not a migration to every package's latest major.

### Dependency maintenance

- Replace inherited `braces` with exact-pinned
  `@dieub/braces-depth-guard@3.0.3-pn.3`, tracked as a canonical dependency and
  selected through an npm alias override. The reviewed fork caps recursive
  nesting at 100 and preserves the APIs used by Chokidar and micromatch.
- Add installed-graph contracts for ordinary patterns, real file watching and
  discovery, package resolution, and controlled rejection of excessive nesting.
- Both full and production audit gates pass on October 16, 2026: each reports
  0 critical, high, or moderate findings and 4 low affected package records in
  the KaTeX family. No advisory ignore or severity reduction was added.
  The [replacement guide](docs/DEPENDENCY-REPLACEMENTS.md) records provenance,
  remaining resource limits, third-party trust, and upstream monitoring.

### Security

- Made server-funded provider keys an explicit opt-in.
- Made encrypted cloud sync an explicit opt-in and reduced its request cap.
- Added write capabilities to encrypted cloud sync while preserving legacy
  recovery-code reads.
- Changed browser API key storage to session-only by default.
- Enforce a nonce-based Content Security Policy with scoped media and font sources.
- Added dependency overrides for patched NanoID and PostCSS releases.

### Open source

- Added an MIT license, security policy, contribution guide, code of conduct,
  CI, CodeQL, Dependabot, issue templates, and a customization skill.
