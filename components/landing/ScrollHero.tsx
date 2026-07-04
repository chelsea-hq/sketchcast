"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Particle {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  delay: number;
  seed: number;
  color: string;
}

const COLORS = ["#818cf8", "#c7d2fe", "#e0e7ff", "#6366f1", "#f4f4f5"];

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface BoxAnchor {
  cx: number;
  cy: number;
  h: number;
}

const BOX_LABELS = ["Sketch it", "Say it", "Ship it"];

/** Draws the studio line-art offscreen and samples it into particle targets */
function buildTargets(
  w: number,
  h: number
): { points: Array<{ x: number; y: number }>; boxes: BoxAnchor[] } {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const c = off.getContext("2d");
  if (!c) return { points: [], boxes: [] };

  const sw = Math.min(w * 0.66, 920);
  const sh = (sw * 9) / 16;
  const sx = (w - sw) / 2;
  const sy = h * 0.52 - sh / 2;
  c.strokeStyle = "#fff";
  c.lineWidth = 3;

  const rect = (x: number, y: number, rw: number, rh: number) => {
    c.beginPath();
    c.roundRect(x, y, rw, rh, 8);
    c.stroke();
  };

  rect(sx, sy, sw, sh); // stage frame

  const bw = sw * 0.19;
  const bh = sh * 0.17;
  const by = sy + sh * 0.42;
  const xs = [sx + sw * 0.09, sx + sw * 0.405, sx + sw * 0.72];
  for (const bx of xs) rect(bx, by, bw, bh);

  const ay = by + bh / 2;
  for (let i = 0; i < 2; i++) {
    const x1 = xs[i] + bw + sw * 0.015;
    const x2 = xs[i + 1] - sw * 0.015;
    c.beginPath();
    c.moveTo(x1, ay);
    c.lineTo(x2, ay);
    c.moveTo(x2 - 8, ay - 6);
    c.lineTo(x2, ay);
    c.lineTo(x2 - 8, ay + 6);
    c.stroke();
  }

  // Webcam bubble, bottom-right of the stage
  c.beginPath();
  c.arc(sx + sw * 0.885, sy + sh * 0.8, sh * 0.105, 0, Math.PI * 2);
  c.stroke();

  const img = c.getImageData(0, 0, w, h).data;
  const points: Array<{ x: number; y: number }> = [];
  const step = 3;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (img[(y * w + x) * 4 + 3] > 128) points.push({ x, y });
    }
  }
  const boxes: BoxAnchor[] = xs.map((bx) => ({
    cx: bx + bw / 2,
    cy: by + bh / 2,
    h: bh,
  }));
  return { points, boxes };
}

/**
 * Scroll-scrubbed hero: glowing particles swirl in a dark void and assemble
 * into the studio (stage, diagram, webcam bubble) as the visitor scrolls.
 * Deterministic computed motion; no video, no jank, nothing to download.
 */
export default function ScrollHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrub, setScrub] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = window.innerWidth;
    let H = window.innerHeight;
    let particles: Particle[] = [];
    let boxes: BoxAnchor[] = [];
    let progress = reduced ? 1 : 0;
    let raf = 0;

    const init = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const built = buildTargets(W, H);
      boxes = built.boxes;
      particles = built.points.map((t) => ({
        tx: t.x,
        ty: t.y,
        sx: Math.random() * W,
        sy: Math.random() * H,
        delay: Math.random() * 0.45,
        seed: Math.random() * Math.PI * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };

    const readProgress = () => {
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - H;
      progress = reduced
        ? 1
        : Math.min(1, Math.max(0, total > 0 ? -rect.top / total : 1));
    };

    const onScroll = () => {
      readProgress();
      setScrub((prev) => (Math.abs(prev - progress) > 0.02 ? progress : prev));
    };

    const t0 = performance.now();
    const draw = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        const local = Math.min(
          1,
          Math.max(0, (progress - p.delay * 0.5) / (1 - p.delay * 0.5))
        );
        const e = ease(local);
        const wobble = (1 - e) * 16 + 1.5;
        const x = p.sx + (p.tx - p.sx) * e + Math.sin(time * 0.8 + p.seed) * wobble;
        const y = p.sy + (p.ty - p.sy) * e + Math.cos(time * 0.7 + p.seed) * wobble;
        ctx.globalAlpha = 0.3 + 0.7 * e;
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, 2.2, 2.2);
      }
      // Labels hand-write themselves inside the assembled boxes, one per beat
      boxes.forEach((box, i) => {
        const a = Math.min(1, Math.max(0, (progress - (0.62 + i * 0.12)) / 0.09));
        if (a <= 0) return;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#e0e7ff";
        ctx.font = `600 ${box.h * 0.34}px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(BOX_LABELS[i], box.cx, box.cy + (1 - a) * 10);
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    init();
    readProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", init);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative" style={{ height: "320vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-zinc-950">
        <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
        {/* Headline dissolves as the studio assembles; the board owns the end state */}
        <div
          className="relative z-10 flex h-full flex-col items-center px-6 pt-[16vh] text-center"
          style={{
            opacity: Math.max(0, Math.min(1, 1 - (scrub - 0.22) / 0.3)),
            transform: `translateY(${-Math.max(0, Math.min(1, (scrub - 0.22) / 0.3)) * 48}px)`,
            pointerEvents: scrub > 0.4 ? "none" : "auto",
          }}
        >
          <p className="mb-5 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            For creators who teach
          </p>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
            Explain it once.
            <br />
            Post it everywhere.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
            The whiteboard recording studio for educational creators. Keep
            scrolling: the studio builds itself, just like your next video.
          </p>
          <div className="mt-7 flex items-center gap-4">
            <Link
              href="/studio"
              className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Start free
            </Link>
            <span className="text-xs text-zinc-500">
              Free during beta · runs in your browser
            </span>
          </div>
        </div>
        {/* CTA returns once the studio has assembled */}
        <div
          className="absolute inset-x-0 bottom-[9vh] z-10 flex flex-col items-center gap-3"
          style={{
            opacity: Math.max(0, Math.min(1, (scrub - 0.86) / 0.12)),
            pointerEvents: scrub > 0.9 ? "auto" : "none",
          }}
        >
          <p className="text-sm font-medium text-zinc-300">
            Your studio is ready.
          </p>
          <Link
            href="/studio"
            className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Start free
          </Link>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-zinc-500 transition-opacity"
          style={{ opacity: Math.max(0, 1 - scrub * 4) }}
        >
          Scroll to assemble the studio ↓
        </div>
      </div>
    </div>
  );
}
