# Sketchcast Studio

Record whiteboard explainers with your webcam and a teleprompter, entirely in the browser. Type a concept, get a ready-made diagram on an Excalidraw board, drag the pieces around as you talk, and export a platform-ready video.

## What it does

- **AI diagrams**: describe a concept in the Diagram AI tab and Claude turns it into a whiteboard layout (boxes, arrows, talk track). One click drops it onto the board where every piece stays draggable. Works offline with template diagrams when no API key is set.
- **Recording**: the board and your webcam bubble are composited into one video at full export resolution. 16:9 (1920×1080), 9:16 (1080×1920), and 1:1 (1080×1080).
- **Teleprompter**: your script scrolls over the stage while you record. Only you see it; it is never captured in the video.
- **Webcam bubble**: circular overlay, bottom-right by default. Click it to move corners, use the slider to resize. What you see on stage is exactly what lands in the export.
- **Social copy**: generate hooks, titles, platform descriptions, and hashtags for the finished video. One click to copy each.
- **Templates**: save the board, script, format, and webcam layout. Load it back for the next topic.
- **Named projects + Recovery Vault**: every project keeps its own board, script, layout, and finished takes privately in IndexedDB, so a refresh or browser restart does not erase the session.
- **Encrypted cloud sync**: optionally sync a project between devices with a recovery code. The browser encrypts the board, script, and layout before upload; video takes stay local.
- **Images**: paste (Cmd+V), drag-drop, or use the board's image tool.

## Quick start

```bash
npm ci
npm run dev
```

Open http://localhost:3000, click "Start session · camera + mic", and record.

## API keys (bring your own)

Users paste their own keys through the **Keys** button in the studio header. Keys use session storage by default, so closing the browser session clears them. Persistent browser storage is an explicit opt-in for trusted personal devices.

For a private local installation, you can opt into server-side defaults in `.env.local`:

```
SKETCHCAST_ALLOW_SERVER_KEYS=true
ANTHROPIC_API_KEY=your-key
SKETCHCAST_MODEL=claude-opus-4-8
```

Server-funded keys are disabled by default. Do not enable them on a public deployment without authentication, durable rate limits, and per-user quotas.

## Deepgram key (optional, unlocks transcript editing)

Add a Deepgram key in the studio to enable transcript editing. For a private local installation, `DEEPGRAM_API_KEY` can be used only when `SKETCHCAST_ALLOW_SERVER_KEYS=true`. Audio is extracted in the browser and sent to Deepgram only when you select **Load transcript**. Without a key, manual cut controls continue to work.

## Encrypted cloud sync (optional)

Cloud sync is disabled by default. To self-host it, set `SKETCHCAST_ENABLE_CLOUD_SYNC=true`, connect a private Vercel Blob store, and add a durable platform rate limit for `/api/sync`.

The browser generates a 256-bit recovery code and encrypts project data with AES-GCM before upload. Writes also require a separate capability derived from that code, so knowing a storage lookup id is not enough to overwrite a project. The server stores ciphertext only and cannot recover a lost code. Sync includes the board, script, format, and webcam layout. Recordings remain in the device's Recovery Vault.

See [Security Model](docs/SECURITY-MODEL.md) for the trust boundaries and safe hosting modes.

## Creator Cloud (optional hosted business layer)

The repository remains a complete MIT-licensed Community edition. The optional
Creator Cloud layer adds Clerk accounts, Stripe subscriptions, durable Upstash
entitlements and quotas, managed provider usage, protected encrypted sync,
unlimited layouts, and branded action slides.

Creator Cloud is fail-closed: if auth, billing, or quota storage is not fully
configured, the Community studio keeps working but hosted checkout and funded
services do not activate. See `.env.example` for the required variables. Before
turning on funded provider keys in production:

1. Configure Clerk, Stripe, and Upstash and set all production secrets.
2. Create monthly and annual recurring Stripe Prices, plus the optional founding Price.
3. Point a Stripe webhook at `/api/billing/webhook` for checkout and subscription events.
4. Set `SKETCHCAST_ALLOW_SERVER_KEYS=true` and `SKETCHCAST_REQUIRE_SYNC_SUBSCRIPTION=true`.
5. Keep the Vercel firewall limits enabled and add provider spend alerts.

The checkout route selects server-owned Price IDs; it never accepts an amount or
Price ID from the browser. Subscription state comes from verified Stripe webhooks,
not client claims. Managed usage is reserved atomically in Upstash before provider calls.

## Safe deployment modes

| Mode | Account required | Host-funded services | Recommended use |
| --- | --- | --- | --- |
| Local or self-hosted BYOK | No | None | Default public-repo experience |
| Public BYOK deployment | No | Optional sync only | Add platform limits before enabling sync |
| Hosted Creator Cloud | Yes | AI, transcription, and sync | Configure Clerk, Stripe webhooks, Upstash quotas, firewall, and spend alerts |

Never commit `.env.local` or provider credentials. Copy `.env.example`, then enable only the services you intend to fund.

## Customize it with Codex or Claude Code

Sketchcast is the working product. The optional [Sketchcast Customizer skill](skills/sketchcast-customizer/SKILL.md) helps an agent safely turn a fork into a branded creator dashboard without weakening the secure defaults. The companion [customization guide](docs/CUSTOMIZATION.md) includes starter prompts and the files agents should touch.

## Quality and security checks

```bash
npm run check
npm run audit:release
```

CI runs lint, tests, production build, and a high-or-critical dependency gate. CodeQL and Dependabot are configured under `.github/`.

Security reports should follow [SECURITY.md](SECURITY.md). Please do not open a public issue for a suspected vulnerability.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

## Notes

- Recording uses MediaRecorder. Chrome and Edge export best (mp4 where supported, webm otherwise). Safari support varies.
- Takes and project drafts are kept in the browser's local Recovery Vault. Nothing is uploaded unless the user explicitly runs encrypted cloud sync; video takes are never part of sync. Browser storage can still be cleared by the user or operating system, so download final videos you care about.
- Templates live in localStorage; very large pasted images can exceed the browser's storage quota.
