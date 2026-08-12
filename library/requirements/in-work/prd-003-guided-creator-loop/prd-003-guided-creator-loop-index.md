---
id: prd-003
title: Guided creator loop
status: in-work
owner: Chelsea Hulin
created: 2026-08-12
---

# PRD 003: Guided creator loop

## Objective

Turn the existing studio tools into one confident creator journey:
`Projects -> Prepare -> Record -> Review -> Edit -> Export`. The experience
should be approachable on first use, fast for returning creators, and truthful
about what stays on the device.

## Product principles

- Adapt proven creator-tool patterns without copying proprietary screens,
  assets, or copy.
- Put the next useful action in the foreground and move advanced controls one
  step deeper.
- Preserve the Community edition as free, account-free, card-free, and
  local-first.
- Keep mobile useful for project selection and preparation while describing
  desktop recording support honestly.

## Requirements

### Creator home

- Open the Studio on a responsive project home instead of dropping a new user
  directly into a dense canvas.
- Show recent local projects with name, last activity, format, and locally
  stored take count.
- Provide searchable projects and clear actions to resume, start diagram-first,
  start script-first, or start from a blank board.
- Explain the four-step workflow and local-only storage in plain language.
- Provide a direct route back to Projects from the working studio.

### Recording readiness and focus

- Replace the immediate Record action with a preflight sheet showing Recovery
  Vault, format, board, camera/mic, and prompter readiness.
- Keep board-only recording available when camera or microphone permission is
  unavailable or intentionally skipped.
- Start recording after a visible, cancelable three-second countdown.
- Reduce nonessential chrome during countdown and recording while keeping Stop,
  Pause, elapsed time, stage, and recorded-area guidance available.

### Take review

- After Stop, show an explicit Take Ready state instead of sending the creator
  into a side panel.
- Make local-save status, playback, Edit, Download, Record again, and return to
  Studio visible without hunting.
- Preserve the warning that unsaved takes should be downloaded immediately.

### Editor and export

- Promote the editor from a small modal to a full-screen responsive workspace.
- Keep transcript cuts, manual cuts, filler removal, action slides, and Creator
  brand-kit behavior intact.
- Separate Edit and Export into clear stages, show final duration, and allow
  selection of 16:9, 9:16, or 1:1 output.
- State that export runs locally in real time and requires the tab to remain
  visible.
- Return an exported take to the Take Ready state with the correct output
  format and filename.

## Security and privacy constraints

- Do not upload recordings, transcripts, projects, or project metadata as part
  of this feature.
- Do not add analytics, shared provider keys, cookies, or mandatory accounts.
- Continue using IndexedDB for Recovery Vault data and object URLs for local
  playback and download.
- Existing encrypted cloud sync remains explicit, optional, and unchanged.
- Existing BYOK/Creator Cloud transcript behavior remains explicit and
  unchanged.

## Acceptance criteria

- Creator Home is the default Studio entry on desktop and mobile; opening a
  project enters the canvas and Back to Projects returns safely.
- Project cards report correct take counts without loading take blobs into UI
  state.
- Record opens preflight, countdown is cancelable, and board-only recording is
  never blocked by missing media permissions.
- Stop reveals Take Ready and a persisted take still survives reload through
  the Recovery Vault.
- Editor renders at full viewport on desktop and mobile, and an edited export
  uses the selected output ratio.
- Lint, Vitest, Next production build, and production dependency audit pass.
- Local and Vercel Preview browser QA pass the Projects -> Studio -> Preflight
  path at desktop and mobile widths with no unexpected console errors or
  horizontal overflow.
- Preview is verified before merging to `main`; production is verified after
  promotion.

## Out of scope

- Uploading, hosting, or sharing video takes.
- Mobile browser recording support.
- Collaborative editing, teams, comments, or a cloud project database.
- Changes to Creator Cloud pricing, entitlement, billing, or auth behavior.
