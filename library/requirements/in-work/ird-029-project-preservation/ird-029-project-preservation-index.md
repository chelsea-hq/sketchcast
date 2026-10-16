---
id: ird-029
title: Preserve project scenes and confirm storage commits
status: in-work
created: 2026-10-15
---

# Project preservation

Parent: [PRD 005](../prd-005-community-project-toolkit/prd-005-community-project-toolkit-index.md).

## Defects

1. Reload opens Creator Home without mounting Board. Initialization leaves the
   scene ref empty. Create invokes saveActiveProject and overwrites the restored
   project's scene with an empty scene before opening the new project.
2. Recovery Vault resolves a request before its IndexedDB transaction commits.
   A late abort can therefore appear as a successful save.
3. Autosave failures are logged only to console while the UI implies recovery is
   available. Creators need a visible failure state with retry/download actions.

## Acceptance

- A regression fails before the fix for reload → create without canvas mount;
  after the fix the previous board, script, format and webcam are preserved.
- A transaction aborted after request success rejects and does not persist data.
- Failed autosaves show a persistent alert and can be retried; downloading the
  current snapshot remains possible even if persistence is unavailable.
- No database schema or existing user data is cleared or migrated.

## Evidence

2026-10-15: implementation and regression verification complete locally;
formal Quality was initially blocked by the parent dependency finding.
On October 16, Security cleared the remediated graph and independent Quality
passed against this IRD and PRD 005.

- `components/Studio-preservation.test.tsx`: the reload → create regression
  failed with an empty saved scene before initialization seeded the scene ref.
  It now passes and preserves the previous board and script before Board mounts.
- `lib/recovery-vault.test.ts`: the late IndexedDB abort regression failed
  before request completion was replaced with transaction completion. It now
  rejects the save and confirms that the write did not persist.
- A failed-save/retry component test confirms the persistent alert, blocked
  project creation, and recovery after a successful retry. The current snapshot
  remains downloadable without a successful storage write.
- An additional delayed-open regression failed before project transitions
  shared the operation guard; it now prevents overlapping open/create actions.
- The final production Chromium workflow creates a starter, reloads to project
  home, creates a blank project, and compares the earlier saved scene and script
  exactly. All four browser workflows passed; all three preservation component
  tests passed after the final markup-only adjustment.

No schema change, existing-data migration, or database reset was introduced.
See the [parent handoff](../prd-005-community-project-toolkit/reports/handoff-2026-10-16.md)
for candidate identity, test environment, and release limitations.

Final [Quality report](qa/2026-10-16-qa-report.md): PASS, zero open findings.
Independent Chromium failure/retry/download/reload checks also passed. Local
acceptance is complete; the parent handoff records release boundaries.
