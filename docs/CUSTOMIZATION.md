# Customize Sketchcast with an AI coding agent

The application is the product. The optional skill gives Codex or Claude Code a
repeatable, security-aware workflow for adapting a fork.

## Good customization targets

- Product name, logo, colors, fonts, and landing-page copy
- Default recording formats and templates
- Creator-specific tools and side panels
- Provider choices and offline fallbacks
- A private deployment for a team or client

## Start with this prompt

```text
Use the Sketchcast Customizer skill in skills/sketchcast-customizer/SKILL.md.
Turn this fork into a creator dashboard for [audience]. Keep local-first and
BYOK defaults. Before editing, show me the proposed product name, visual system,
features to keep, and features to remove. Then implement and verify the app.
```

## Security choices the agent should not make silently

- Enabling shared provider keys on a public deployment
- Enabling cloud sync without durable platform limits
- Adding analytics, authentication, storage, billing, or third-party uploads
- Changing what recordings or project data leave the browser
- Weakening CSP, origin checks, body limits, or secret redaction

## Verification

Every customized fork should pass:

```bash
npm run check
npm run audit:release
```

Then test the landing page, studio load, board editing, key settings, offline AI
fallback, camera and microphone permission flow, a short recording, and export
in a real browser.
