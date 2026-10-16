# Contributing to Sketchcast

Build and verify Sketchcast's account-free Community workflow before opening a pull request.

## Before you start

1. Search existing issues and pull requests.
2. Open an issue before a large product, storage, or security change.
3. Never commit API keys, `.env.local`, recordings, or private customer data.

## Local workflow

Use Node.js 22.22.2 or newer within 22.x and npm (`nvm use` if nvm is installed). Community needs no
environment file, account, or provider key. Open `/studio` after startup and
use a synthetic topic from the [README walkthrough](README.md#make-your-first-recording).

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run check
npm run audit:all
```

`check` runs lint, `next typegen && tsc --noEmit`, Vitest, and the production
build. Run one test file with `npm test -- lib/your-module.test.ts`.
Development and build commands copy the installed Excalidraw fonts into
`public/excalidraw/`; those generated files are gitignored. Build needs network
access to download the configured Google fonts.

The October 16, 2026 full and production audit gates pass. Each reports
0 critical, high, or moderate findings and 4 low affected package records in
the KaTeX dependency family. A temporary, exact-pinned braces replacement
provides depth guards; no advisory is suppressed. See the
[replacement guide](docs/DEPENDENCY-REPLACEMENTS.md) before updating it.
Keep the canonical dependency and npm alias override synchronized, retain the
lockfile, and rerun the installed-graph contract tests. Continue monitoring the
original advisory as well as the fork. Do not lower audit thresholds or use
forced downgrades to obtain a pass.

## Run browser checks

After `npm ci`, install the pinned Playwright Chromium browser and run the suite:

```bash
PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium
npm run test:e2e
```

The browser-install flag preserves browser versions used by other local projects.
The suite starts its own development server at `http://127.0.0.1:3338`; leave
that port free. It never reuses a running server. Each test uses a fresh browser
context with synthetic projects. The test server clears the optional settings
listed in `.env.example`, overriding values Next.js would load from local
environment files. Browser requests to third-party services are blocked.

For production-mode checks, use a clean checkout with no `.env.local` and no
hosted-service configuration in the build environment, then run:

```bash
npm run build
SKETCHCAST_E2E_PRODUCTION=1 npm run test:e2e
```

The production flag runs `next start` against that build. It does not rebuild
the application or remove values already embedded during a previous build.

The suite covers starter boards and previews, duplication, preservation after
reload, project-file roundtrips into a fresh browser, malformed-file rejection,
mobile preparation, modal keyboard behavior, search/sort, and a board-only
recording download. Artifacts and failure traces go in gitignored
`output/playwright/`. Real camera/microphone quality, other browsers, and deployed
behavior still need the [release checklist](docs/RELEASE-CHECKLIST.md).
`npm run check` does not run the separate browser suite. CI runs it after the
production build with `SKETCHCAST_E2E_PRODUCTION=1`.

## Code map

| Area | Start here |
| --- | --- |
| Pages | `app/page.tsx`, `app/studio/page.tsx` |
| Creator flow | `components/Studio.tsx`, `components/CreatorHome.tsx` |
| Recording and editing | `lib/recorder.ts`, `lib/take-editor.ts`, `components/TakeEditor.tsx` |
| Local persistence | `lib/recovery-vault.ts`, `lib/templates.ts` |
| Project files and examples | `lib/project-file.ts`, `lib/starter-projects.ts`, `components/ProjectPreview.tsx` |
| Browser checks | `playwright.config.mts`, `tests/e2e/community.spec.ts` |
| Dependency compatibility | `lib/dependency-contracts.test.ts`, `docs/DEPENDENCY-REPLACEMENTS.md` |
| Providers | `lib/ai.ts`, `lib/providers.ts`, `lib/user-keys.ts`, `app/api/` |
| Hosted services | `lib/creator-cloud.ts`, `docs/CREATOR-CLOUD-SETUP.md` |
| Requirements | `library/requirements/`, `library/issues/` |

See [ROADMAP.md](ROADMAP.md) for contribution priorities. New features need a
PRD in `library/requirements/`; bug fixes need an IRD and a regression test
that fails before the fix and passes after it. Discuss large changes first.
Read `SECURITY.md` and `docs/SECURITY-MODEL.md` before changing routes, storage,
providers, sync, or hosting. Check this repo's installed Next.js guides in
`node_modules/next/dist/docs/` before applying framework patterns.

## Pull requests

- Keep changes focused and explain the user-visible result.
- Add or update tests for behavior changes.
- Include browser verification notes for recording, Excalidraw, key storage,
  cloud sync, or export changes.
- Preserve local-first and BYOK defaults.
- Update documentation when environment variables or trust boundaries change.
- Keep the [project-file guide](docs/PROJECT-FILES.md) aligned with supported
  fields and limits. Test malformed files and preservation of existing projects
  when changing import, export, or duplication.

Follow [docs/RELEASE-CHECKLIST.md](docs/RELEASE-CHECKLIST.md) for browser QA.
State the browser, OS, server mode, and paths actually tested. Temporary captures
belong in gitignored `output/playwright/`; never use private user data for QA.

Security vulnerabilities should be reported privately through
[SECURITY.md](SECURITY.md), not through a public issue.
