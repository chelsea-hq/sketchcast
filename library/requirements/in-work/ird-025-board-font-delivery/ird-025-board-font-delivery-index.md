---
id: ird-025
title: Serve board fonts under the existing security policy
status: in-work
owner: Chelsea Hulin
created: 2026-09-05
---

# IRD 025: Serve board fonts locally

## Reproduction

On baseline `40c3466`, run the production build, open `/studio` in a fresh
Chromium profile, and create a diagram project. Excalidraw requests fonts from
`esm.sh`; the existing `font-src 'self' data:` policy blocks them. The observed
browser session reported 192 errors after mounting the board.

## Fix and acceptance

- Copy the installed Excalidraw package's pre-subsetted fonts into a generated,
  gitignored public asset directory before development and production builds.
- Configure Excalidraw's documented `window.EXCALIDRAW_ASSET_PATH` before board
  initialization. Preserve nonce/script protections and general connection limits.
- Test real font delivery preparation and browser asset configuration, then
  confirm the board loads local fonts without CSP violations in production mode.
- Keep third-party files unmodified and copied from the lockfile-selected
  package. Document their source; do not commit generated binaries.

## Browser finding during implementation

Local asset configuration alone does not suppress CSP errors: the installed
package always appends an esm.sh fallback to each FontFace source list, and
Chromium checks that URL during construction. An instrumented browser confirmed
local-first source order. Permit only the exact 0.18.1 font directory in
`font-src`, with a regression covering its narrow scope. Do not enable general
CDN connections or change script policy.

## Existing product requirement

PRD 003's diagram-first creator flow requires the board to render. PRD 004
requires a reproducible Community installation and honest browser evidence.
