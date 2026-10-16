# Local repository hygiene review

Date: October 16, 2026. Data collection: **local clone only**, read-only;
no API credentials/settings inspection and no workflow dispatch or publication.
Scope: the local modernization candidate after Security and all three Quality
reports passed. This is a scoped hygiene review, not a full scored GitHub audit.

Checkout `/Users/chelsea/Projects/sketchcast`, branch
`codex/open-source-readiness`, base `40c34666420bd6b7072fdae7b81bb93a8df9aec9`
plus the uncommitted implementation. Source/config identity is in
[source-fingerprints-2026-10-16.json](source-fingerprints-2026-10-16.json).
Raw local observations are in `output/verification-2026-10-16/repository-health-input.json`.

**Disposition: local review complete.** The configured verification stages,
community files and evidence exclusions were inspected. No new application or
security blocker was identified by this hygiene review. The maintenance items
and remote coverage gaps below remain separate from the passing scoped Quality
reports. This review does not approve a commit, merge or release.

## Coverage across the eight dimensions

| Dimension | Local observation | Limitation or follow-up |
| --- | --- | --- |
| Branch protection/rulesets | N/A; no remote settings inspected | Required checks, reviewers, bypass and force-push protection remain unverified at the repository's Settings → Rules page. |
| Commit quality | `git log -100` has 29 available commits; 3 follow the standard feat/fix/docs/etc prefix form; mean subject length 57.2; no exact generic noise subjects | Existing descriptive history remains intact. Maintainer can choose a future subject convention; no rewriting is warranted by this review. |
| CODEOWNERS | Absent from `CODEOWNERS`, `.github/CODEOWNERS` and `docs/CODEOWNERS` | Maintainer/reviewer assignment is not automated; choose real owners before adding rules. |
| CI workflow coverage | `.github/workflows/ci.yml:29-64` has frozen install, lint, unit tests, typecheck, production build, Chromium and full audit. `.github/workflows/codeql.yml` adds analysis and weekly scheduling | Exact remote run, Linux execution, required-check alignment and effective token policy were not verified. |
| Documentation | README, LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT and CHANGELOG exist; README has setup, usage, CI and license links | SUPPORT is optional and absent; existing contributing/security paths provide contact guidance. |
| Repository settings | N/A; no remote settings inspected | Merge policy, auto-delete, secret scanning, push protection and Dependabot alert status remain unknown. A config file does not prove an enabled remote service. |
| Issue/PR templates | Two substantive issue forms and a PR template exist under `.github/`; bug report requests reproduction and environment, feature request asks creator need and service/data impact | PR checklist omits standalone typecheck and the full audit even though CI runs both. Its runtime-only audit entry is less complete than contributor instructions. |
| Ignore coverage | `.gitignore:3-51` excludes dependencies, Next output, environment files except example, coverage, Vercel state, browser evidence, verification receipts and generated board assets | Generic `*.key`, `credentials.json` and service-account filenames are not ignored. No such tracked files or build output were found in the inspected index. Private notes/knowledge remain untracked and must not be mass-staged. |

Six GitHub YAML files parsed successfully using an already-installed YAML
parser. `git diff --check` passed. Direct `git check-ignore` probes confirmed
the relevant environment, build, dependency and local-evidence exclusions.
These checks do not scan history for secrets or validate GitHub's live settings.

## Automation inputs and authority

| Job | Configured event and executable inputs | Declared authority and evidence limits |
| --- | --- | --- |
| `CI / verify` | Pull requests and pushes to main; default checkout with no explicit ref override; source scripts and dependency graph can change in a PR | `contents: read` at lines 8-9. No explicit secret reference, environment or OIDC grant. Hosted `ubuntu-latest`, 20-minute timeout, concurrency cancellation. Effective repository policy and runner state are unverified. |
| `CodeQL / analyze` | Main push/PR, manual dispatch, weekly schedule; default checkout; analysis actions pinned to SHA | `contents: read`, `security-events: write` at lines 12-14, matching analysis upload purpose. Job runs only when repository is public (line 19); a skipped job is not analysis proof. No remote run was claimed. |

All action references in these workflows are pinned to full commit SHAs.
CI installs with `npm ci`, which allows lifecycle hooks; the local frozen
installation used `--ignore-scripts`. Local application checks passed with that
installation, but they do not prove remote install-hook execution. The reviewed
replacement itself has no install hooks.

`setup-node` configures npm caching. No workflow restores an executable build
artifact from another run, and no `pull_request_target` or `workflow_run` chain
appears in the inspected files. The only artifact upload is synthetic browser
failure evidence with seven-day retention. There is no downstream artifact
execution step. Checkout credential persistence and repository-default grants
were not inferred from omitted settings.

No remote candidate SHA/run/attempt or required check App was observed. The
local source fingerprints and successful logs establish local candidate proof
only; they are not evidence of GitHub merge eligibility or deployment success.

## Ranked maintenance recommendations

These are hygiene improvements, not findings that reopen the completed scoped
Security/Quality reviews. Impact and effort are qualitative 1–5 estimates.

| Priority | Evidence and implication | Impact / effort | Owner |
| --- | --- | --- | --- |
| 4.0 | No CODEOWNERS file: choose actual maintainers for reviews of workflow, dependency and security-sensitive changes | 4 / 1 | Chelsea / repository maintainer; assignment requires a real owner decision |
| 3.0 | `.github/pull_request_template.md:7-11` omits typecheck and full audit: align future PR evidence prompts with `CONTRIBUTING.md` and CI | 3 / 1 | Repository maintainer; workflow architecture, if changed, belongs to CI Release |
| 2.0 | `.gitignore:23-35` has no generic key/service-account patterns: consider those additional preventive exclusions before hosting integrations expand | 2 / 1 | Repository maintainer; actual exposure questions belong to Security |
| 0.5 | `git log -100` shows mixed subject conventions: document a future preference if automated release tooling needs it | 1 / 2 | Repository maintainer; preserve existing history |

Before a remote release decision, inspect branch rules and required checks,
security settings, merge policy, and the exact candidate's GitHub run. These are
coverage gaps, not claims that protections are disabled. Repository settings
were not changed in this pass. The single local worktree and all four existing
local branches were preserved.
