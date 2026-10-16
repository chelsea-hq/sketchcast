---
id: ird-027
title: Include contributor dependencies in the audit gate
status: in-work
owner: Chelsea Hulin
created: 2026-09-05
---

# IRD 027: Contributor dependency audit

A fresh `npm ci` reports a high advisory in development-only Browserslist 4.28.4
through eslint-config-next/Babel, although the production-only audit passes.
GitHub advisories GHSA-c83g-rgw3-j3cx and GHSA-73wf-gq98-2v4g identify versions
through 4.28.6 as affected; 4.28.7 is patched.

Refresh the compatible transitive package, inspect the lockfile diff, and add a
full dependency audit to CI. Keep the production-only command for diagnosis.
The regression gate is `npm audit --audit-level=high`: it fails before the
lockfile refresh and must pass after it. Re-run installation, checks, and build
against the updated lockfile. Do not force major changes or downgrades.

Sources: https://github.com/advisories/GHSA-c83g-rgw3-j3cx and
https://github.com/advisories/GHSA-73wf-gq98-2v4g.
