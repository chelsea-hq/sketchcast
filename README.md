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

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, click "Start session · camera + mic", and record.

## API keys (bring your own)

Users paste their own keys via the **⚙ Keys** button in the studio header; keys are stored only in their browser. For your own machine you can also put keys in `.env.local` as a server-side default:

```
ANTHROPIC_API_KEY=sk-ant-…
SKETCHCAST_MODEL=claude-opus-4-8
```

`SKETCHCAST_MODEL` accepts any Claude model id; drop it to `claude-haiku-4-5` for cheaper generations.

## Deepgram key (optional, unlocks transcript editing)

With `DEEPGRAM_API_KEY` set in `.env.local`, the take editor gains transcript editing: load a word-by-word transcript, click the first and last word of a flub to cut it, and remove filler words ("um", "uh") in one click. Costs about 2 cents per 5-minute video. Audio is extracted in the browser and sent to Deepgram only when you click "Load transcript"; without the key the manual cut buttons work as before.

## Encrypted cloud sync (optional)

Cloud sync uses a private Vercel Blob store and requires `BLOB_READ_WRITE_TOKEN` in `.env.local` and the Vercel deployment environments. The browser generates a 256-bit recovery code and encrypts project data with AES-GCM before sending it to `/api/sync`. The server stores ciphertext only and cannot recover a lost code. Sync includes the board, script, format, and webcam layout; recordings remain in the device's Recovery Vault.

## Notes

- Recording uses MediaRecorder. Chrome and Edge export best (mp4 where supported, webm otherwise). Safari support varies.
- Takes and project drafts are kept in the browser's local Recovery Vault. Nothing is uploaded unless the user explicitly runs encrypted cloud sync; video takes are never part of sync. Browser storage can still be cleared by the user or operating system, so download final videos you care about.
- Templates live in localStorage; very large pasted images can exceed the browser's storage quota.
