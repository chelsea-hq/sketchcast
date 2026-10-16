# Sketchcast roadmap

The priority is a free, self-hostable whiteboard-to-video studio for creators
and educators. The Community workflow should remain useful without an account,
provider key, or subscription. These are priorities, not delivery-date promises.

## Current local candidate

The Community project toolkit adds versioned local project files, duplication,
three original teaching starters, actual board previews, and search/sort.
See the [project-file guide](docs/PROJECT-FILES.md) and [unreleased changelog](CHANGELOG.md#unreleased).
These changes are in local review; implementation does not establish a published
release, deployed preview, or production verification.

On October 16, 2026, both full and production audit gates pass with 0 critical,
high, or moderate findings and 4 low affected package records in the KaTeX family
in each scope. The temporary [braces replacement](docs/DEPENDENCY-REPLACEMENTS.md)
contains reviewed depth guards and preserves the original audit thresholds.
The replacement candidate passed frozen installation, lint, typechecking,
177 unit/component tests, the production build, and four production-mode Chromium
workflows. Independent Security and Quality passed the reviewed local scope;
the following local repository hygiene review is complete. The
[handoff](library/requirements/in-work/prd-005-community-project-toolkit/reports/handoff-2026-10-16.md)
records remaining maintenance recommendations and remote release checks.

## Make the core loop dependable

- Verify fresh install → project → diagram → record → review → edit → download
  with no credentials.
- Release capture resources between takes and test recording lifecycle failures.
- Serve board fonts locally under the existing security policy.
- Align setup, screenshots, privacy explanations, and browser limitations with
  the current product.
- Make storage initialization and quota failures explicit and recoverable.
- Verify permissions, pause/resume, repeated takes, reload recovery, and export
  cancellation in real browsers.

## Improve the creator experience

- Verify project-file transfer and previews with larger real-world boards and
  supported raster images, using synthetic content.
- Review keyboard focus, Escape handling, labels, contrast, and reduced motion
  across the project, preflight, settings, review, and editor dialogs.
- Gather feedback on the three original teaching examples before expanding
  the library; keep asset provenance and editable sample scripts explicit.
- Distinguish provider errors from no-key template mode. Verify model
  availability before changing defaults.
- Improve project-file error guidance based on contributor reports, preserving
  the explicit distinction between project content and downloaded recordings.

## Before a wider announcement

- Run the [release checklist](docs/RELEASE-CHECKLIST.md) on the exact candidate.
- Retain the completed Security and Quality reports for this exact candidate;
  re-evaluate relevant changes before shipping.
- Monitor the remaining low KaTeX findings, original braces advisory, and
  replacement package. Retire the fork when an official compatible fix passes
  the same dependency contracts and application checks.
- Review Git history for secrets/private material and distributed asset/license
  provenance. MIT metadata alone does not prove a full audit.
- Refresh landing-page imagery and record a real, short first-take demo.
- Verify a deployed preview, then approved production, as separate steps.
- Reconcile older in-work requirements against delivered behavior.

## Optional hosted convenience

Creator Cloud includes account, billing, quota, and encrypted project-sync code.
Enabling those services is a separate launch with verified configuration,
budgets, and complete billing tests. Keep the core workflow independent of it.

## Good first contributions

- Reproduce one release-checklist scenario with browser/OS and exact steps.
- Improve a confusing setup instruction after trying a fresh installation.
- Add a focused recording or cancellation regression using synthetic media.
- Propose a keyboard accessibility fix with reproduction and verification.

Check existing issues and discuss larger UX, storage, and provider changes
before implementing them. Never attach private projects or credentials.
