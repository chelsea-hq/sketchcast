import { FORMATS, webcamRect, type FormatKey, type WebcamLayout } from "./formats";

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export interface RecorderOptions {
  /** The element that contains the Excalidraw canvases (the stage) */
  boardEl: HTMLElement;
  /** Read the live webcam video element each frame; null when the camera is off */
  getVideo: () => HTMLVideoElement | null;
  /** Mic/cam MediaStream so audio tracks can be mixed in, or null */
  micStream: MediaStream | null;
  format: FormatKey;
  /** Read the webcam layout each frame so live tweaks show up in the recording */
  getWebcam: () => WebcamLayout;
  onStop: (result: RecordingResult) => void;
}

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  extension: string;
  durationMs: number;
  format: FormatKey;
}

/**
 * Composites the whiteboard canvases plus the webcam bubble into a single
 * offscreen canvas at the exact export resolution, then records it with
 * MediaRecorder. The teleprompter lives outside this pipeline on purpose:
 * it is never captured.
 */
export class SessionRecorder {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private pausedTotal = 0;
  private pausedAt = 0;

  constructor(private opts: RecorderOptions) {
    const spec = FORMATS[opts.format];
    this.canvas = document.createElement("canvas");
    this.canvas.width = spec.width;
    this.canvas.height = spec.height;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  static pickMimeType(): string {
    if (typeof MediaRecorder === "undefined") return "";
    return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
  }

  start(): void {
    const mimeType = SessionRecorder.pickMimeType();
    if (!mimeType) throw new Error("This browser cannot record video");

    const stream = this.canvas.captureStream(30);
    const audioTrack = this.opts.micStream?.getAudioTracks()[0];
    if (audioTrack) stream.addTrack(audioTrack);

    this.recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });
    this.chunks = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.onstop = () => {
      cancelAnimationFrame(this.raf);
      const blob = new Blob(this.chunks, { type: mimeType });
      this.opts.onStop({
        blob,
        mimeType,
        extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm",
        durationMs: performance.now() - this.startedAt - this.pausedTotal,
        format: this.opts.format,
      });
    };

    this.startedAt = performance.now();
    this.pausedTotal = 0;
    this.recorder.start(1000);
    this.draw();
  }

  pause(): void {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
      this.pausedAt = performance.now();
    }
  }

  resume(): void {
    if (this.recorder?.state === "paused") {
      this.pausedTotal += performance.now() - this.pausedAt;
      this.recorder.resume();
    }
  }

  stop(): void {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  private draw = (): void => {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Excalidraw renders its static content and in-progress strokes on
    // stacked canvases inside the board element; draw them in DOM order.
    const layers = this.opts.boardEl.querySelectorAll<HTMLCanvasElement>(
      "canvas.excalidraw__canvas"
    );
    for (const layer of layers) {
      if (layer.width === 0 || layer.height === 0) continue;
      ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, W, H);
    }

    this.drawWebcam(W, H);
    this.raf = requestAnimationFrame(this.draw);
  };

  private drawWebcam(W: number, H: number): void {
    const layout = this.opts.getWebcam();
    const video = this.opts.getVideo();
    if (!layout.visible || !video || video.readyState < 2) return;

    const { x, y, d } = webcamRect(layout, W, H);
    const r = d / 2;
    const cx = x + r;
    const cy = y + r;

    // Cover-crop the center square of the camera feed into the circle
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;

    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = d * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(video, sx, sy, side, side, x, y, d, d);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r - d * 0.01, 0, Math.PI * 2);
    ctx.lineWidth = d * 0.02;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.stroke();
  }
}
