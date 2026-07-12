# Changelog

Notable changes to Sketchcast are recorded here.

## Unreleased

### Security

- Made server-funded provider keys an explicit opt-in.
- Made encrypted cloud sync an explicit opt-in and reduced its request cap.
- Added write capabilities to encrypted cloud sync while preserving legacy
  recovery-code reads.
- Changed browser API key storage to session-only by default.
- Added a Content Security Policy in Report-Only mode.
- Added dependency overrides for patched NanoID and PostCSS releases.

### Open source

- Added an MIT license, security policy, contribution guide, code of conduct,
  CI, CodeQL, Dependabot, issue templates, and a customization skill.
