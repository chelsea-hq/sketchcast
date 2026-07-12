<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sketchcast safety rules

- Read `SECURITY.md` and `docs/SECURITY-MODEL.md` before changing API routes,
  browser storage, cloud sync, provider integrations, or deployment settings.
- Keep local-first and bring-your-own-key behavior as the default.
- Do not enable shared provider keys or cloud sync silently.
- Never commit `.env.local`, provider keys, recovery codes, recordings, or
  private user data.
- Treat local build, browser verification, deployment, and production behavior
  as separate proof layers.
- For a branded fork, use `skills/sketchcast-customizer/SKILL.md`.
