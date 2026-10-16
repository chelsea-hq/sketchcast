---
id: ird-030
title: Replace vulnerable brace-pattern processing
status: completed
owner: Chelsea Hulin
created: 2026-10-16
---

# Bounded brace-pattern replacement

Parent: [PRD 005](../prd-005-community-project-toolkit/prd-005-community-project-toolkit-index.md).

Chelsea explicitly authorized a safe replacement for the dependency blocking
release, followed by Security and QA. Work remains local and uncommitted on
`codex/open-source-readiness` at base `40c3466`; prior changes are preserved.

## Defect and scope

`braces@3.0.3` is inherited through Excalidraw/Sass/Chokidar and Next's lint
tooling/fast-glob/micromatch. Deeply nested patterns reach unbounded recursive
AST walkers and throw a native stack-overflow error. Both dependency audit
gates fail. No published upstream fixed release was available at intake.

The replacement must contain a real reviewed fix with traceable source and
retained license notices. Renaming an unchanged vulnerable package, suppressing
the advisory, weakening checks, forced downgrades, and dropping lint rules do
not meet this request.

## Acceptance

1. Verify the exact replacement's source, maintainer, license, tarball integrity,
   install hooks, and dependency graph. Record remaining trust limitations.
2. Reproduce the stack-exhaustion defect before replacement and verify controlled
   bounded rejection afterward, including public parser/walker entry points.
3. Preserve brace expansion/compilation contracts used by Chokidar and
   micromatch/fast-glob: alternatives, ranges, nesting, escaping, nodupes,
   empty-value handling, and matching/find-file behavior.
4. Pass a frozen npm install, full and production high/critical audits, lint,
   typecheck, unit/component tests, production build, and Community browser
   workflows. Keep the original manifests/lockfile available for rollback.
5. Complete independent Security re-evaluation first, then Quality against
   PRD 005 and this IRD; finish the applicable Repository Health gate.
6. Update the existing handoff, dependency/security reports, and release notes
   with exact evidence and remaining limitations. No publishing or deployment.

## Checkpoint

Replacement installed and verified locally. Original package manifests, lockfile,
and test configuration remain preserved; backup location is recorded in
`/tmp/sketchcast-dependency-20261016-path.txt`.

Baseline regression evidence: `npx vitest run lib/dependency-contracts.test.ts`
on the unchanged graph passed six compatibility cases and failed seven depth
checks. An 8,003-character input with 4,000 nested braces bypasses the original
10,000-character cap and reaches native stack exhaustion in the walkers.
Direct deeply nested AST inputs also overflow. Ordinary nested alternatives,
padded ranges, escaping, duplicate/empty handling, AST roundtrips, micromatch,
and real fast-glob file discovery all pass before replacement.


2026-10-16 verification checkpoint: adopted exact
`@dieub/braces-depth-guard@3.0.3-pn.3` as a canonical dependency and npm alias
for both `braces` consumers. The source patch, tarball integrity, registry
signatures, build provenance, license, and compatibility experiments are in
[the replacement report](reports/dependency-replacement-2026-10-16.md).

The full application graph passed `npm ci --ignore-scripts --loglevel=error`
(718 packages installed), both audit gates (zero Critical/High/Moderate; four
Low KaTeX-family affected package records), lint, strict typecheck, all 177
unit/component tests in 24 files, and production build. All 17 dependency
contracts passed, including actual Chokidar watching and fast-glob discovery.
All four production Chromium workflows passed in 12.8 seconds without retries.

The first full-check attempt used an incomplete prior temporary copy: Next
regenerated a tsconfig without the project's aliases and strict setting, so
typecheck failed. A fresh source copy with the original strict tsconfig resolved
that environment defect. No source typechecking requirement was weakened.
Failure and successful receipts remain in `output/verification-2026-10-16/`.
The tested source/config identity is recorded in the parent's
[source fingerprints](../prd-005-community-project-toolkit/reports/source-fingerprints-2026-10-16.json).
Formal [Security cleared the scope](../prd-005-community-project-toolkit/reports/security-2026-10-16.md).
[Independent Quality passed](qa/2026-10-16-qa-report.md), with zero open findings.
The subsequent [Repository Health review](../prd-005-community-project-toolkit/reports/repository-health-2026-10-16.md)
is complete. All six local acceptance items are fulfilled; remaining maintainer
hygiene recommendations and remote release checks are recorded in the handoff.


## Production completion, October 16, 2026

Shipped in [PR 44](https://github.com/chelsea-hq/sketchcast/pull/44), merge
`94a4a8d45db89a907f38dd433eb926fe664023d6`, with deployed application source
`9b7f8b165cdcdffbf7ee7b55a36bfe59d704a997`. The production Community workflows
passed after promotion. Earlier local checkpoints above remain historical.
See the [production release record](../prd-005-community-project-toolkit/reports/production-release-2026-10-16.md)
for exact deployment, checks, rollback, and remaining limits.
