# Braces replacement research

Date: 2026-10-16. Owner: Dependency Audit Wasp Drone. Parent:
[IRD 030](../ird-030-bounded-braces-replacement-index.md).

## Recommendation and scope

Use exact published `@dieub/braces-depth-guard@3.0.3-pn.3` as a direct
dependency, with the existing transitive `braces` requests resolved to the same
artifact through npm's alias override:

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

Preserve other dependencies and overrides. A local adapter is unnecessary for
the npm behavior actually tested below. This is a reviewed third-party patch,
not an official fixed release of `micromatch/braces`. Its source contains real
depth checks addressing [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Successful audit output alone does not establish remediation.

This investigation modified only this report in the repository. Candidate
extraction, minimal dependency installations, and evidence files used disposable
directories outside the checkout. Parent owns adoption, the application test
suite, build, browser verification, and final Security/Quality gates. The
checkout was `codex/open-source-readiness`, base `40c3466`, with existing dirty
work preserved; no commit, push, or deployment was performed.

## Affected graph and actual consumers

The pre-replacement installed graph contained these edges:

```text
@excalidraw/excalidraw@0.18.1 -> sass@1.51.0 -> chokidar@3.6.0 -> braces@3.0.3
eslint-config-next@16.3.8 -> @next/eslint-plugin-next@16.3.8
  -> fast-glob@3.3.1 -> micromatch@4.0.8 -> braces@3.0.3
next@16.3.8 -> sass@1.51.0 (deduplicated)
vitest@4.1.11 -> vite@8.3.4 -> sass@1.105.2 -> chokidar@5.0.0
```

The last edge does not use the affected `braces` dependency. Chokidar 3 calls
`braces.expand(path)` on string paths. Micromatch calls `braces(String(pattern),
options)` and exposes string brace expansion. These observed consumers do not
provide caller-built AST objects. App sources do not directly import Sass or
braces; the board uses precompiled Excalidraw CSS. Next's lint root-directory
utility invokes fast-glob for configured `settings.next.rootDir`; the current
ESLint config does not specify that setting. This bounded review did not find
a remote application input path to braces, but the package remains in the
installed production-classified graph and the unchanged high-severity gate
must pass.

`@socketregistry/braces` and `@socketregistry/micromatch` returned registry
E404 during this investigation. They are not available replacement choices.

## Exact artifact, source, and provenance

| Field | Verified value |
| --- | --- |
| Package | `@dieub/braces-depth-guard@3.0.3-pn.3` |
| Published | `2026-10-04T18:01:17.784Z` |
| Registry maintainer | `dieub` |
| Repository | <https://github.com/dieub/braces-depth-guard> |
| Exact source revision | `305a2e4bfe324bb53c336c1b03387ee1251c926f` |
| License | MIT; original Jon Schlinkert copyright and upstream attribution retained |
| Engine | Node `>=8`; investigated with Node `22.22.3` |
| Runtime dependency | `fill-range: ^7.1.1` |
| Install hooks | None; package scripts contain only `test` |
| Published contents | 10 files; 30,655 unpacked bytes |

The [registry metadata](https://registry.npmjs.org/@dieub%2fbraces-depth-guard/3.0.3-pn.3)
and [exact tarball](https://registry.npmjs.org/@dieub/braces-depth-guard/-/braces-depth-guard-3.0.3-pn.3.tgz)
reported this integrity:

```text
sha512-QY+Uq4s42STyIMPoRkBuUZfYyvz0uZuwuUburLwMx5N+lWqnHHaBxcKPtgKVKjTyFnS1q4ivKu9Wxi4VG7FE9Q==
```

Independent SHA-512 hashing of downloaded bytes matched. The equivalent hex
digest is:

```text
418f94ab8b38d924f220c3e846406e5197d8cafcf4b99bb0b946eeacbc0cc7937e956aa71c7681c5c28fb602952a34f21674b5ab88af2aef56c62e151bb144f5
```

All 10 tarball files byte-matched the [pinned source tree](https://github.com/dieub/braces-depth-guard/tree/305a2e4bfe324bb53c336c1b03387ee1251c926f):
`LICENSE`, `README.md`, `package.json`, `index.js`, and six `lib/*.js` files.
Archive extraction separately rejected non-regular members, paths outside
`package/`, and parent traversal. Extracted files are available locally at:

```text
/var/folders/4m/zst472c563z_bxx2dz_mg1380000gn/T/sketchcast-braces-candidate-zasvj97b/package
```

Two registry ECDSA signatures both verified with Node `crypto.verify('sha256',
...)`, using the registry's public key from
<https://registry.npmjs.org/-/npm/v1/keys> and signed message
`<package-name>@<version>:<integrity>`. Key ID:

```text
SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U
```

The [published attestations](https://registry.npmjs.org/-/npm/v1/attestations/@dieub%2fbraces-depth-guard@3.0.3-pn.3)
include an npm publish statement and SLSA v1 provenance. Cryptographic Sigstore
verification passed using the existing npm-bundled `sigstore` library, with
these exact constraints:

```text
certificateIdentityURI:
https://github.com/dieub/braces-depth-guard/.github/workflows/publish.yml@refs/tags/3.0.3-pn.3
certificateIssuer:
https://token.actions.githubusercontent.com
```

The verified statement binds the artifact digest above to commit
`305a2e4bfe324bb53c336c1b03387ee1251c926f` and
[GitHub Actions run 37222647499, attempt 1](https://github.com/dieub/braces-depth-guard/actions/runs/37222647499/attempts/1).
The source workflow publishes with `--provenance --ignore-scripts` after its
own test/audit steps. Verification used the already-installed module at
`/Users/chelsea/.hermes/node/lib/node_modules/npm/node_modules/sigstore`;
the only trust-cache write was a disposable TUF directory. Signatures prove
artifact origin and integrity, not that every behavior is safe.

This is a recently published package with a single listed maintainer. Its
`latest` tag points to the earlier bootstrap version; exact pinning is
essential. The published README still describes pn.3 as unpublished, which is
documentation drift: registry publication and verified provenance establish
that the reviewed version was published. Do not silently follow tags or later
versions.

## Patch and API assessment

The fork identifies [upstream proposed PR 72](https://github.com/micromatch/braces/pull/72)
at `d0d575e55e74a4e0218e5248fafb79efc3e54ebb` as its guard basis, with
documented follow-up changes. The proposal is not an official fixed release.
The full runtime diff against installed `braces@3.0.3` was inspected:

- `MAX_DEPTH` is 100. Parsing checks the next brace/parenthesis nesting level
  before accepting it and throws a controlled `SyntaxError` above the limit.
- Compile, expand, and stringify also guard recursive AST walking and throw a
  controlled `RangeError` above the limit. Parser-only protection is not the
  whole patch.
- Expansion's upward parent walks detect cycles with a `Set` and reject them.
- Finite non-negative `maxDepth` values are capped at 100; smaller/fractional
  values enforce the smaller bound. Negative finite values reject.
  Nonfinite/nonnumeric values, including `false`, infinity, NaN, strings, and
  boxed numbers, use the default 100 rather than disabling the guard.
- Each processor reads its limit option once, preventing a stateful getter
  from changing a checked finite value to NaN within that processor.
- The hard parsing-length ceiling remains 10,000 characters. Numeric NaN and
  negative `maxLength` values reject; positive infinity and oversized numbers
  remain capped. Public wrappers can invoke multiple processors and therefore
  read an option more than once across the complete call.
- `index.js` remains byte-identical to upstream. The callable export and
  `parse`, `stringify`, `compile`, `expand`, and `create` methods are preserved.
  Original stringify parent semantics are retained.

The original numeric `rangeLimit` default of 1,000 remains; explicitly setting
`rangeLimit: false` still disables that numeric-range limit. There is no new
Cartesian expansion cardinality cap, AST width cap, or bound on long acyclic
parent chains in caller-built ASTs. Arbitrary object getters/malformed ASTs
are not comprehensively handled. Short-string `create` shortcuts can skip
validation of an unused stricter option without bypassing the hard ceilings.

These limits do not invalidate the reviewed fix for deeply nested string
patterns consumed here. Parsed string ASTs are constrained by the parser's
100-level and 10,000-character bounds. No caller-built AST exposure was found
in the observed consumers, so adding a general AST compatibility layer or
patching unrelated resource limits is outside this bounded replacement.

## Executed compatibility and scanner experiments

An in-memory loader of the verified source passed 36 ordinary comparisons
against original braces: compile, expand, and stringify for 12 patterns
covering alternatives, padded/stepped numeric ranges, descending letters,
empty alternatives, nested sets, escaping, quotes, dollar syntax, unmatched
braces, and parentheses. Boundary probes accepted depth 100 and rejected
depth 101 and 4,000 across public processors for both braces and parentheses.
The direct AST walker probes rejected a depth-101 AST produced by the original
parser. Numeric expansion `{1..1001}` rejected; ten `{a,b}` groups produced
1,024 outputs, confirming the absence of a Cartesian-output cap.

An additional 56 assertions against the installed disposable candidate passed
for the option behavior described above, including `maxDepth: false`, both
infinities, NaN, boxed/nonnumeric values, above-limit values, negative values,
and finite-to-NaN getters. The first harness attempt expected incorrect wording
for the length error; its assertion was corrected to the actual controlled
`exceeds max characters` diagnostic, then all assertions passed.

Three separate minimal npm graphs used Chokidar 3.6.0 and micromatch 4.0.8.
Each ran `npm install --ignore-scripts --no-fund --loglevel=error`,
`npm audit --json`, `npm ls braces @dieub/braces-depth-guard --json`, and
`npm ci --ignore-scripts --no-fund --loglevel=error` under npm 10.9.8:

| Graph | Install / ls / ci | npm audit | Lockfile identity |
| --- | --- | --- | --- |
| Original braces | All exit 0 | Exit 1, three high findings | `braces@3.0.3` |
| Exact fork alias override only | All exit 0 | Exit 0, zero findings | Alias entry includes real fork name, exact version, URL, integrity, MIT |
| Direct canonical exact dependency plus alias override | All exit 0 | Exit 0, zero findings | Canonical package entry plus alias entry, both the same verified artifact |

The third graph is the recommendation. Raw manifests, lockfiles, command
stdout/stderr, structured results, and option checks are retained at:

```text
/var/folders/4m/zst472c563z_bxx2dz_mg1380000gn/T/sketchcast-braces-alias-audit-63dcy42w/
  results.json
  option-guards.json
  baseline/
  alias-only/
  canonical-and-alias/
```

These are minimal graph results, not the application's final audit evidence.
GitHub Dependabot/dependency-graph interpretation was not exercised. The
[AWS Labs consumer policy](https://github.com/awslabs/cli-agent-orchestrator/blob/main/SECURITY.md)
documents adoption of this exact fork and uses a canonical dependency plus
local adapter to address its scanner interpretation and availability concerns.
It also applies an additional acyclic-parent-walk patch. That is useful
precedent, not proof that Sketchcast needs the same adapter or patch. The npm
experiment above supports the simpler exact alias for this project's verified
gate. No AWS code was copied.

## Remaining acceptance and maintenance

Parent should run the committed regression suite against the installed graph,
including actual Chokidar watching and fast-glob discovery, ordinary API
behavior, and controlled deep-string/direct-AST rejection. Then verify the
complete graph's frozen install, production/full audits, lint, typecheck,
application tests, build, and browser workflows. Independent Security must
review this exact artifact before Quality completes IRD/PRD acceptance.

Keep the canonical dependency and override versions synchronized and retain
the exact lockfile integrity. Review the original braces advisory/upstream
releases alongside the fork's releases during dependency maintenance: npm
advisories addressed to the upstream package do not automatically establish
coverage for a differently named fork. A clean audit is not a blanket claim
about every denial-of-service behavior. Remove the temporary fork/override
when a compatible official fixed release has passed the same contracts.

No advisory ignore, scanner suppression, severity reduction, metadata version
rewrite, forced downgrade, or application-input policy change is proposed.


## Application adoption result (parent, October 16)

The recommended exact canonical dependency and alias are now installed in the
full Sketchcast graph. `npm ci --ignore-scripts --loglevel=error` completed
successfully with 718 packages installed. Both full and production audits
passed their unchanged high threshold, with zero Critical/High/Moderate and
four Low affected package records in the KaTeX family.

All 17 installed-graph dependency contracts passed. The full application check
passed lint, strict typecheck, 177 tests in 24 files, and production build;
four production-mode Chromium workflows passed in 12.8 seconds. Actual
Chokidar watching, fast-glob discovery, and decoded recording playback were
included. The final [Security re-evaluation](../../prd-005-community-project-toolkit/reports/security-2026-10-16.md)
clears this scope to independent Quality. The
[current handoff](../../prd-005-community-project-toolkit/reports/handoff-2026-10-16.md)
tracks subsequent Quality and Repository Health results and exact evidence.
No release action was performed.
