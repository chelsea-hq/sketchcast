# Dependency modernization evidence

> Historical October 15 evidence. The approved replacement and October 16
> verification are tracked in [IRD 030](../../ird-030-bounded-braces-replacement/ird-030-bounded-braces-replacement-index.md);
> the earlier dependency blocker described below is resolved in that candidate.

Date: 2026-10-15 America/Chicago (checks continued into 2026-10-16 UTC).
Owner: dependency audit agent; final application verification and Security review
belong to the parent PRD 005 execution.

## Scope and result

Checkout: `/Users/chelsea/Projects/sketchcast`. The parent-verified PRD records
branch `codex/open-source-readiness`, base `40c3466`, with existing uncommitted
work preserved. This agent changed only `package.json`, `package-lock.json`, and
this report. No commit, publication, provider request, or deployment occurred.

The dependency update removed all reported critical advisories and all
moderate advisories. **Both high-severity audit gates still fail** because the
unpatched `braces` advisory remains in the graph. Counts below are affected
package records, including propagated findings, not distinct vulnerabilities.

| Scope | Before | After | Gate |
| --- | --- | --- | --- |
| All dependencies | 1 critical, 13 high, 2 moderate, 4 low | 0 critical, 8 high, 0 moderate, 3 low | Failed, exit 1 |
| Production dependencies | 1 critical, 7 high, 0 moderate, 4 low | 0 critical, 4 high, 0 moderate, 3 low | Failed, exit 1 |

No severity threshold, ignore, forced downgrade, or peer-check bypass was added.

## Selected versions

| Package | Before | After |
| --- | --- | --- |
| `next`, `eslint-config-next` | 16.3.0 | 16.3.8 |
| `react`, `react-dom` | 19.2.4 | 19.2.8 |
| `@types/node` | 20.19.43 | 22.20.5 |
| `vitest` | 4.1.10 | 4.1.11 |
| `eslint` | 9.39.4 | 9.39.5 |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.2 | 4.3.3 |
| `@playwright/test` | absent | 1.64.1 |
| `sharp` | 0.35.3 | 0.35.5 |
| `brace-expansion` | 1.1.18 / 5.0.9 | 1.1.21 / 5.0.12 |
| `js-yaml` | 4.3.1 | 4.3.2 |
| `source-map-js` | 1.2.1 | 1.2.2 |
| `dompurify` | affected locked version | 3.4.17 |
| `undici` | 6.28.0 / 8.10.2 | 6.29.1 / 8.12.2 |

Versions were checked against the public npm registry. Framework pairs stay
aligned. Next 16.3.8, published September 30, resolves the affected Next version
ranges in this audit; it avoids a simultaneous move to the freshly released
16.4 line. The current 16.4.2 lint plugin still uses `fast-glob@3.3.1`, so moving
to that release would not eliminate the remaining lint dependency finding.
See the [Next 16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8).

`test:e2e` now invokes `playwright test`. Playwright 1.64.1 is an exact stable
pin published October 14, selected for the newly requested reproducible browser
suite. Browser installation, configuration, and test execution are separate
parent-owned work. TypeScript 5, ESLint 9, Vitest 4, and the editor versions were
retained; no broad major-version migration was attempted.

## Unresolved advisory families

### High: braces, GHSA-vfj7-8cjw-p6xm

Two observed paths remain:

```text
@excalidraw/excalidraw@0.18.1
  -> sass@1.51.0 -> chokidar@3.6.0 -> braces@3.0.3

eslint-config-next@16.3.8
  -> @next/eslint-plugin-next@16.3.8
  -> fast-glob@3.3.1 -> micromatch@4.0.8 -> braces@3.0.3
```

The [advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and registry
both show no fixed published `braces` version; 3.0.3 remains latest. Deeply
nested attacker-supplied patterns can exhaust the Node.js stack.

Observed application reachability is limited: application source does not
import Sass, Chokidar, fast-glob, micromatch, or braces. `components/Board.tsx`
imports the editor's already-built CSS. The Next lint plugin calls fast-glob
for configured `settings.next.rootDir` globs; this project's ESLint config does
not supply that setting, and API request input is not passed into that utility.
This is source evidence, not a proof that every production bundle and possible
future feature is unaffected. Production artifact tracing remains for Security.

Excalidraw pins Sass to 1.51.0. Overriding Sass to a newer version could remove
that one dependency path, but would depart from the editor's pinned graph and
would leave the lint path intact. No speculative override was applied. There
is no patched same-package braces target to select. Replacing its implementation
or lint dependency requires separate compatibility and security evidence.

The npm suggestions to downgrade Excalidraw to 0.17.6 or Next lint config to
14.2.35 were rejected. This finding remains unresolved and release-blocking
under the existing policy; it is not an accepted exception.

### Low: KaTeX, GHSA-238p-pmpm-9mq7

```text
@excalidraw/mermaid-to-excalidraw@2.2.2
  -> mermaid@11.16.1 -> katex@0.16.47
```

The [advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7) is fixed in
0.18.2. Mermaid 11.16.1 requires `^0.16.45`; even Mermaid 11.17.2 requires
`^0.16.47`. The patched KaTeX line is outside those ranges. An override would
cross a pre-1.0 minor compatibility boundary and requires math/diagram browser
tests, so no patch-only override was available in this slice.

The application does render provider-supplied Mermaid via
`lib/board-actions.ts`, so the rendering family is reachable. The advisory also
requires pre-existing prototype pollution or attacker influence on renderer
option prototypes, then unsanitized rendered output. Those prerequisites were
not demonstrated here; this is not a finding that arbitrary diagram input
alone produces script execution. Security should review this condition and
the converter's sanitization before choosing an upgrade or mitigation.

Follow-up owner: PRD 005 Security review. Review target: 2026-10-22. Tracking
record: [PRD 005](../prd-005-community-project-toolkit-index.md). No remote
tracking issue, waiver, or automated suppression was created.

## Installation and verification

Environment: macOS Darwin 25.5.0, Node 22.22.3, project npm 10.9.8; `.nvmrc`
targets Node 22 and the manifest requires `^22.22.2`.

The initial npm 10 installation hit the documented Arborist `edgesOut` resolver
failure while resolving Vitest/Vite optional peers. A scoped
`npm exec --yes --package=npm@11.19.0 -- npm install --ignore-scripts` resolved
the graph without changing global tooling. Targeted updates used that same
scoped installer. The resulting optional Sass peer entries required a final
normal `npm install --ignore-scripts` under npm 10 before frozen installation.
See the [npm issue](https://github.com/npm/cli/issues/9787).

Final checks:

- `npm ci --ignore-scripts --loglevel=error`: passed under npm 10.9.8; 716 packages installed.
- Root manifest dependency maps match the lockfile: passed.
- `npm ls braces katex --all` and targeted patched dependency inspection: passed, with the exact remaining paths above.
- `npm audit --audit-level=high --json`: exit 1, 8 high and 3 low records.
- `npm audit --omit=dev --audit-level=high --json`: exit 1, 4 high and 3 low records.
- Application lint, typecheck, Vitest, build, and browser tests: parent-owned; not run by this agent.

Install scripts were disabled. Excalidraw's nested older Radix components still
declare React 16–18 peers and cause npm peer warnings, although Excalidraw's own
peer declaration includes React 19. Board rendering, editor tabs, and drawing
interaction need the planned browser verification. No `--force` or
`--legacy-peer-deps` was used.

Evidence fingerprints at dependency handoff:

```text
package.json
ec98c57a2f2a2857418acf8765c1cfbe667164ca035e3b1c473990b1287bcc3e
package-lock.json
9ae9b3d2e0d0cb1c5b7ef95547e167842f5a9c6a59eec4dd6ca1a8a120f343cb
```

CI already uses `npm ci` and the full high/critical audit gate. Existing
Dependabot groups and SHA-pinned Actions were retained. A future small config
change can add a seven-day Dependabot version-update cooldown and group Next
with its lint config and React with React DOM; GitHub supports these controls
without replacing Dependabot. Its cooldown does not delay security updates.
See [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown).

## Continuation: supported upgrade paths rechecked

The parent rechecked the public registry and GitHub advisory after the local
handoff. `braces` still publishes 3.0.3 as latest, and the advisory still lists
no patched release. Excalidraw remains 0.18.1 with Sass pinned to 1.51.0; the
latest Next lint plugin, 16.4.2, still depends on fast-glob 3.3.1. A normal
supported upgrade therefore does not clear either inherited High path.

Mermaid 12.2.0 now uses the patched KaTeX line, but the current latest
`@excalidraw/mermaid-to-excalidraw` 2.2.2 supports Mermaid `^11.12.1`.
The newest 11.x release, 11.17.2, still uses KaTeX `^0.16.47`. Replacing that
major dependency would require converter compatibility work; it is not an
available supported update and would not clear the High braces blocker.

No packages, overrides, audit thresholds, or suppression rules were changed
during this recheck. Source evidence:
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
[braces registry](https://registry.npmjs.org/braces/latest),
[editor registry](https://registry.npmjs.org/@excalidraw%2fexcalidraw/latest),
[Next lint registry](https://registry.npmjs.org/@next%2feslint-plugin-next/latest),
[converter registry](https://registry.npmjs.org/@excalidraw%2fmermaid-to-excalidraw/latest).
