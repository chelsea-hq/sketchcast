import { FORMATS, type FormatKey } from "./formats";
import { SessionRecorder } from "./recorder";
import type { BrandKit } from "./brand-kit";

export interface CutRegion {
  id: string;
  start: number;
  end: number;
}

export interface ActionSlide {
  id: string;
  /** Timestamp in the source video where the slide is inserted */
  at: number;
  text: string;
  seconds: number;
  brand?: BrandKit;
}

export type SequenceItem =
  | { type: "clip"; start: number; end: number }
  | { type: "slide"; text: string; seconds: number; brand?: BrandKit };

/** Source ranges that survive after removing the cut regions. */
export function keptRanges(
  duration: number,
  cuts: CutRegion[]
): Array<{ start: number; end: number }> {
  const sorted = cuts
    .map((c) => ({
      start: Math.max(0, Math.min(c.start, c.end)),
      end: Math.min(duration, Math.max(c.start, c.end)),
    }))
    .filter((c) => c.end > c.start)
    .sort((a, b) => a.start - b.start);

  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const cut of sorted) {
    if (cut.start > cursor) ranges.push({ start: cursor, end: cut.start });
    cursor = Math.max(cursor, cut.end);
  }
  if (cursor < duration) ranges.push({ start: cursor, end: duration });
  return ranges.filter((r) => r.end - r.start > 0.05);
}

/**
 * Interleaves kept clips with action slides. A slide "at" time t plays at
 * that moment of the source: mid-clip it splits the clip; inside a cut or
 * between clips it plays before the next kept clip.
 */
export function buildSequence(
  duration: number,
  cuts: CutRegion[],
  slides: ActionSlide[]
): SequenceItem[] {
  const ranges = keptRanges(duration, cuts);
  const pending = [...slides].sort((a, b) => a.at - b.at);
  const items: SequenceItem[] = [];

  for (const range of ranges) {
    let cursor = range.start;
    while (pending.length > 0 && pending[0].at < range.end) {
      const slide = pending.shift();
      if (!slide) break;
      const splitAt = Math.max(slide.at, range.start);
      if (splitAt > cursor) items.push({ type: "clip", start: cursor, end: splitAt });
      items.push({ type: "slide", text: slide.text, seconds: slide.seconds, brand: slide.brand });
      cursor = splitAt;
    }
    if (range.end > cursor) items.push({ type: "clip", start: cursor, end: range.end });
  }
  for (const slide of pending) {
    items.push({ type: "slide", text: slide.text, seconds: slide.seconds, brand: slide.brand });
  }
  return items;
}

export function sequenceDuration(items: SequenceItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum + (item.type === "clip" ? item.end - item.start : item.seconds),
    0
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
}

function drawSlide(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number,
  brand?: BrandKit
): void {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const fontSize = Math.round(Math.min(W, H) * 0.075);
  ctx.font = `600 ${fontSize}px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive`;
  ctx.fillStyle = "#1e1e1e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapText(ctx, text, W * 0.8);
  const lineHeight = fontSize * 1.35;
  const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });
  // Marker-style underline accent below the text block
  const underlineY = startY + lines.length * lineHeight * 0.85;
  ctx.strokeStyle = brand?.accent ?? "#6366f1";
  ctx.lineWidth = Math.max(3, fontSize * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(W / 2 - W * 0.12, underlineY);
  ctx.quadraticCurveTo(W / 2, underlineY + fontSize * 0.18, W / 2 + W * 0.12, underlineY);
  ctx.stroke();
  if (brand?.signature) {
    ctx.font = `600 ${Math.max(18, Math.round(fontSize * 0.34))}px sans-serif`;
    ctx.fillStyle = brand.accent;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(brand.signature, W * 0.94, H * 0.94);
  }
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve) =>
    target.addEventListener(event, () => resolve(), { once: true })
  );
}

async function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.03) return;
  const done = once(video, "seeked");
  video.currentTime = time;
  await done;
}

export interface EditedExport {
  blob: Blob;
  mimeType: string;
  extension: string;
  durationMs: number;
}

/**
 * Re-renders the take through a canvas, skipping cut regions and drawing
 * action slides between clips. Runs in real time (export takes as long as
 * the final video) because the source plays back while being re-recorded.
 * The tab must stay visible; background tabs throttle rendering.
 */
export async function exportEditedTake(options: {
  sourceUrl: string;
  format: FormatKey;
  duration: number;
  cuts: CutRegion[];
  slides: ActionSlide[];
  onProgress: (doneSeconds: number, totalSeconds: number) => void;
}): Promise<EditedExport> {
  const { sourceUrl, format, duration, cuts, slides, onProgress } = options;
  const sequence = buildSequence(duration, cuts, slides);
  if (sequence.length === 0) throw new Error("Nothing left after the cuts");
  const total = sequenceDuration(sequence);

  const spec = FORMATS[format];
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const video = document.createElement("video");
  video.src = sourceUrl;
  video.playsInline = true;
  video.preload = "auto";
  await once(video, "loadedmetadata");
  // MediaRecorder blobs often report Infinity until forced to the end
  if (!Number.isFinite(video.duration)) {
    const fixed = once(video, "durationchange");
    video.currentTime = 1e7;
    await fixed;
    video.currentTime = 0;
  }

  // Route the source audio into the recording instead of the speakers
  const audioCtx = new AudioContext();
  await audioCtx.resume();
  const audioSource = audioCtx.createMediaElementSource(video);
  const audioDest = audioCtx.createMediaStreamDestination();
  audioSource.connect(audioDest);

  const mimeType = SessionRecorder.pickMimeType();
  if (!mimeType) throw new Error("This browser cannot record video");
  const stream = canvas.captureStream(30);
  const audioTrack = audioDest.stream.getAudioTracks()[0];
  if (audioTrack) stream.addTrack(audioTrack);

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const stopped = once(recorder, "stop");

  let raf = 0;
  const runDrawLoop = (draw: () => void) => {
    cancelAnimationFrame(raf);
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
  };

  recorder.start(1000);
  try {
    let emitted = 0;
    for (const item of sequence) {
      if (item.type === "slide") {
        runDrawLoop(() => drawSlide(ctx, item.text, spec.width, spec.height, item.brand));
        const base = emitted;
        const t0 = performance.now();
        while (performance.now() - t0 < item.seconds * 1000) {
          await new Promise((r) => setTimeout(r, 100));
          onProgress(base + (performance.now() - t0) / 1000, total);
        }
        emitted = base + item.seconds;
      } else {
        await seekTo(video, item.start);
        await video.play();
        runDrawLoop(() =>
          ctx.drawImage(video, 0, 0, spec.width, spec.height)
        );
        const base = emitted;
        await new Promise<void>((resolve) => {
          const check = () => {
            onProgress(base + (video.currentTime - item.start), total);
            if (video.currentTime >= item.end - 0.03 || video.ended) {
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        });
        video.pause();
        emitted = base + (item.end - item.start);
      }
    }
  } finally {
    cancelAnimationFrame(raf);
    recorder.stop();
    await stopped;
    video.pause();
    video.src = "";
    await audioCtx.close().catch(() => undefined);
  }

  return {
    blob: new Blob(chunks, { type: mimeType }),
    mimeType,
    extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm",
    // Planned output length, not wall clock: seeks and setup overhead
    // would otherwise inflate the reported duration
    durationMs: total * 1000,
  };
}
