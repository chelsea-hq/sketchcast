# Sketchcast Studio

Record whiteboard explainers with your webcam and a teleprompter, entirely in the browser. Type a concept, get a ready-made diagram on an Excalidraw board, drag the pieces around as you talk, and export a platform-ready video.

## What it does

- **AI diagrams**: describe a concept in the Diagram AI tab and Claude turns it into a whiteboard layout (boxes, arrows, talk track). One click drops it onto the board where every piece stays draggable. Works offline with template diagrams when no API key is set.
- **Recording**: the board and your webcam bubble are composited into one video at full export resolution. 16:9 (1920×1080), 9:16 (1080×1920), and 1:1 (1080×1080).
- **Teleprompter**: your script scrolls over the stage while you record. Only you see it; it is never captured in the video.
- **Webcam bubble**: circular overlay, bottom-right by default. Click it to move corners, use the slider to resize. What you see on stage is exactly what lands in the export.
- **Social copy**: generate hooks, titles, platform descriptions, and hashtags for the finished video. One click to copy each.
- **Templates**: save the board, script, format, and webcam layout. Load it back for the next topic.
- **Images**: paste (Cmd+V), drag-drop, or use the board's image tool.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, click "Start session · camera + mic", and record.

## Claude API key (optional but recommended)

Without a key the app uses offline generators. For tailored diagrams and copy, put your key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-…
SKETCHCAST_MODEL=claude-opus-4-8
```

`SKETCHCAST_MODEL` accepts any Claude model id; drop it to `claude-haiku-4-5` for cheaper generations.

## Notes

- Recording uses MediaRecorder. Chrome and Edge export best (mp4 where supported, webm otherwise). Safari support varies.
- Takes live in browser memory until you download them; nothing is uploaded anywhere. Download before closing the tab (the app warns you if you have undownloaded takes).
- Templates live in localStorage; very large pasted images can exceed the browser's storage quota.
