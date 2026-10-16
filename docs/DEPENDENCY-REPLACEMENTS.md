# Dependency replacements

Sketchcast temporarily replaces inherited `braces` with
`@dieub/braces-depth-guard@3.0.3-pn.3`. The fork adds depth limits to the parser
and recursive walkers used by Chokidar and micromatch. This guide records the
exact artifact, compatibility boundary, and maintenance conditions for
contributors changing the dependency graph.

On October 16, 2026, both `npm run audit:all` and `npm run audit:release` pass.
Each reports 0 critical, high, or moderate findings and 4 low affected package
records in the KaTeX family. Counts include propagated package findings; they
are not counts of distinct vulnerabilities. No advisory ignore, scanner
suppression, severity reduction, version-metadata rewrite, or forced downgrade
was used. Audit results do not establish the absence of vulnerabilities.

## Exact package and resolution

The relevant entries in [package.json](../package.json) are:

```json
{
  "dependencies": {
    "@dieub/braces-depth-guard": "3.0.3-pn.3"
  },
  "overrides": {
    "braces": "npm:@dieub/braces-depth-guard@3.0.3-pn.3"
  }
}
```

The canonical dependency makes the replacement explicit. The npm alias resolves
existing requests for `braces` to the same exact fork artifact. Both entries
must stay synchronized with [package-lock.json](../package-lock.json).

The affected consumers are:

| Dependency path | Observed use |
| --- | --- |
| Excalidraw → Sass 1.51 → Chokidar 3 | Expand string paths with `braces.expand` |
| Next lint configuration → fast-glob → micromatch | Compile or expand string patterns |

The observed consumers supply strings, not caller-built abstract syntax trees
(ASTs). The bounded source review found no remote application input path into
these braces calls. This does not remove the package from the installed
production dependency graph or prove that every future use has the same boundary.

The tested npm alias resolves these consumers directly; Sketchcast needs no
local adapter for this graph. GitHub's remote dependency-graph and Dependabot
interpretation remain separate checks from the local npm audit results.

## Source, license, and provenance

The October 16 review verified the following artifact:

| Item | Reviewed value |
| --- | --- |
| Package | `@dieub/braces-depth-guard@3.0.3-pn.3` |
| Source | [dieub/braces-depth-guard](https://github.com/dieub/braces-depth-guard) |
| Exact commit | [`305a2e4bfe324bb53c336c1b03387ee1251c926f`](https://github.com/dieub/braces-depth-guard/tree/305a2e4bfe324bb53c336c1b03387ee1251c926f) |
| License | MIT, retaining Jon Schlinkert's copyright and upstream attribution |
| Registry maintainer | `dieub` |
| Runtime dependency | `fill-range: ^7.1.1` |
| Install hooks | None in the reviewed artifact |

Independent hashing matched the published tarball's SHA-512 integrity:

```text
sha512-QY+Uq4s42STyIMPoRkBuUZfYyvz0uZuwuUburLwMx5N+lWqnHHaBxcKPtgKVKjTyFnS1q4ivKu9Wxi4VG7FE9Q==
```

All ten published files matched the pinned source tree byte for byte. Registry
ECDSA signatures and Sigstore provenance verification passed. The attestation
binds the artifact to the commit above and its GitHub Actions publishing
workflow. These checks establish origin and integrity; they do not establish
that every package behavior is safe. The [registry metadata](https://registry.npmjs.org/@dieub%2fbraces-depth-guard/3.0.3-pn.3)
and [published attestations](https://registry.npmjs.org/-/npm/v1/attestations/@dieub%2fbraces-depth-guard@3.0.3-pn.3)
identify the reviewed release.

This is a recently published third-party fork with one listed maintainer,
not an official fixed release of `micromatch/braces`. Its source includes real
guards for [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The exact pin is deliberate; tags or later versions require a new review.

## Protections and remaining limits

| Surface | Reviewed behavior |
| --- | --- |
| String parsing | Rejects brace or parenthesis nesting deeper than 100 with a controlled `SyntaxError` |
| Compile, expand, stringify | Bound recursive AST walking at 100 with a controlled `RangeError` |
| Depth options | Finite non-negative limits are capped at 100; smaller limits are retained and negative limits reject. Nonnumeric/nonfinite values use the default rather than disable the guard |
| Parsing length | Retains a hard ceiling of 10,000 characters; NaN and negative numeric length options reject, while infinity cannot remove the ceiling |
| Expansion parent walks | Detect and reject cycles |
| Numeric ranges | Retain the upstream default limit of 1,000; explicit `rangeLimit: false` still disables that numeric-range limit |

The patch adds no limit on the number of combinations produced by alternatives
or on AST width. Ten `{a,b}` groups still expand to 1,024 outputs. Long acyclic
parent chains in caller-built ASTs are not bounded, and arbitrary getters or
malformed AST objects are not comprehensively handled. Public wrappers can read
options once in each of several processors. Short-input shortcuts can skip
unused stricter options without removing the hard parser/walker ceilings.

These remaining resource limits matter if a future feature exposes expansion
or caller-built ASTs to untrusted input. This replacement addresses deeply nested
patterns in the observed string consumers; it is not a general resource budget
for every braces API.

## Compatibility and verification

[Dependency contract tests](../lib/dependency-contracts.test.ts) exercise the
installed package through its real consumers. They cover inherited package
resolution, ordinary alternatives, nested/padded ranges, escaping, duplicate
and empty handling, AST roundtrips, micromatch, real fast-glob file discovery,
real Chokidar watching, and controlled rejection of excessive string/AST depth.
They also check nonfinite options and the parser's length ceiling.

Before changing the replacement, run the focused contracts and both audit scopes:

```bash
npm test -- lib/dependency-contracts.test.ts
npm run audit:all
npm run audit:release
```

In the full Sketchcast graph, `npm ci --ignore-scripts --loglevel=error` passed,
installing 718 packages without running lifecycle hooks. The same replacement
candidate passed lint, typechecking, all 177 unit/component tests across 24 files
(including all 17 dependency contracts), the production build, and four
production-mode Chromium workflows. Those results support the alias in the
actual application graph; they are separate from the earlier minimal-graph
experiments.

Independent Security and Quality passed the reviewed replacement candidate.
The subsequent local repository hygiene review is complete. The
[release checklist](RELEASE-CHECKLIST.md) retains the remaining manual device,
hosted-service, and release gates. Passing dependency audits and local checks
does not close those checks or authorize release.

## Monitoring and retirement

Dependency maintenance must monitor both the original
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and upstream
releases, plus the fork's releases and advisories. An advisory addressed to
`braces` does not automatically establish scanner coverage for a differently
named fork. The remaining low KaTeX-family findings also stay visible.

The temporary fork and alias can be retired when an official, compatible
upstream fix is available and passes the same source review, frozen install,
dependency contracts, audits, application checks, and browser workflows.
Retirement must remove the canonical fork dependency and alias together and
refresh the lockfile. Until then, upgrades retain the exact reviewed artifact
and license notices.
