---
id: prd-001
title: Top-tier responsive product and marketing redesign
status: in-work
owner: Chelsea Hulin
created: 2026-08-08
---

# PRD 001: Top-tier responsive product and marketing redesign

## Objective

Make Sketchcast feel like a polished creator product on both the public site and
inside the studio, using current best-in-class creator-tool patterns researched
through Chelsea's Mobbin Pro account. Ship the verified experience to production.

## Product story

An educational creator should understand Sketchcast in seconds, enter a useful
local-first studio without an account, draft comfortably on mobile, and record or
edit with focused controls on desktop.

## Reference principles

The implementation should adapt patterns, not copy brands or assets:

- Riverside marketing: direct verb-led value proposition, one primary CTA,
  immediate product proof, and oversized visual hierarchy.
- Riverside product: persistent but quiet project context, task-first dashboard,
  dark creator workspace, and a single high-salience creation action.
- ChatGPT mobile voice flow: progressive setup, canvas-first screen, minimal top
  chrome, and thumb-reachable bottom controls.

## Requirements

### Public site

- Replace the long scroll-gimmick opening with an immediately legible, premium
  hero that shows the actual product above the fold.
- Communicate the flow as `Sketch -> Record -> Refine -> Publish` using real
  screenshots and honest capability copy.
- Preserve Community/open-source and Creator Cloud positioning without claiming
  hosted capabilities that are not active.
- Replace unsupported time-to-value promises with credible, outcome-led copy.
- Provide accessible focus states, reduced-motion behavior, useful landmarks,
  and touch targets of at least 44px where practical.
- Render cleanly at 390px, 768px, 1440px, and wide desktop widths without
  horizontal overflow or clipped content.

### Studio

- Preserve all current recording, Recovery Vault, BYOK, project, sync, editor,
  and export behavior.
- Make the canvas/stage the visual center of the desktop workspace.
- Reduce top-bar density and group project, safety, account, and device status
  into understandable regions.
- Make the recording action unmistakable while keeping device, format, and
  prompter controls discoverable.
- On mobile, use a canvas-first layout with compact top context, a bottom tool
  dock, and sheet-style panels instead of a squeezed desktop sidebar.
- Mobile must support browsing, drafting, AI/copy/layout work, and project
  recovery. Recording may remain desktop-recommended and must say so honestly.
- Respect safe-area insets and dynamic viewport height.

### Account and supporting surfaces

- Bring account, loading, privacy, terms, and auth wrappers into the same visual
  system where touched by the user journey.
- Keep auth, billing, sync, storage, CSP, and provider-key security boundaries
  unchanged unless a separate security requirement is approved.

## Acceptance criteria

- Lint, Vitest, TypeScript/Next production build, and production dependency audit
  pass or any inherited advisory is explicitly documented before promotion.
- Existing behavioral tests remain green and new UI logic receives regression
  coverage where it can fail independently.
- Local browser QA passes at 390x844, 768x1024, 1440x1000, and 1728x1117.
- Landing, studio, account, privacy, and terms have no unexpected horizontal
  overflow at mobile width.
- Keyboard focus and reduced-motion checks pass on the landing and studio shell.
- A Vercel preview passes the same landing/studio/account smoke flow with no
  unexpected console errors.
- Only after preview UAT passes may the branch merge to `main` and be promoted to
  production.

## Out of scope

- Turning mobile Safari into a supported recording environment.
- Enabling shared provider keys, changing billing ownership, or silently enabling
  cloud sync.
- Copying proprietary Mobbin screenshots, Riverside imagery, or ChatGPT assets
  into the product.
