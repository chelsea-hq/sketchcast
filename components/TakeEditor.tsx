"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { Take } from "./panels/TakesPanel";
import type { FormatKey } from "@/lib/formats";
import {
  buildSequence,
  exportEditedTake,
  sequenceDuration,
  type ActionSlide,
  type CutRegion,
  type EditedExport,
} from "@/lib/take-editor";

interface TakeEditorProps {
  take: Take;
  onClose: () => void;
  onExported: (result: EditedExport) => void;
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const d = Math.floor((seconds % 1) * 10);
  return `${m}:${String(s).padStart(2, "0")}.${d}`;
}

const btn =
  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export default function TakeEditor({ take, onClose, onExported }: TakeEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cuts, setCuts] = useState<CutRegion[]>([]);
  const [slides, setSlides] = useState<ActionSlide[]>([]);
  const [cutIn, setCutIn] = useState<number | null>(null);
  const [slideText, setSlideText] = useState("");
  const [slideSeconds, setSlideSeconds] = useState(2.5);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const now = () => videoRef.current?.currentTime ?? 0;
  const duration = take.seconds;
  const outSeconds = sequenceDuration(buildSequence(duration, cuts, slides));

  const markCutIn = () => setCutIn(now());

  const markCutOut = () => {
    if (cutIn === null) return;
    const end = now();
    if (end <= cutIn + 0.1) {
      toast.error("Move the playhead past the cut start first");
      return;
    }
    setCuts((prev) =>
      [...prev, { id: `cut_${Date.now()}`, start: cutIn, end }].sort(
        (a, b) => a.start - b.start
      )
    );
    setCutIn(null);
  };

  const addSlide = () => {
    const text = slideText.trim();
    if (!text) {
      toast.error("Write the slide text first");
      return;
    }
    setSlides((prev) =>
      [
        ...prev,
        { id: `slide_${Date.now()}`, at: now(), text, seconds: slideSeconds },
      ].sort((a, b) => a.at - b.at)
    );
    setSlideText("");
  };

  const doExport = async () => {
    if (cuts.length === 0 && slides.length === 0) {
      toast.error("Add at least one cut or slide, or just download the original");
      return;
    }
    setExporting(true);
    try {
      const result = await exportEditedTake({
        sourceUrl: take.url,
        format: take.format as FormatKey,
        duration,
        cuts,
        slides,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      onExported(result);
      toast.success("Edited take saved to the Takes tab");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Export failed. Try fewer cuts or re-open the editor.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-full w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Edit take <span className="font-normal text-zinc-500">{take.format} · {Math.round(duration)}s</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className={`${btn} bg-zinc-800 text-zinc-300 hover:bg-zinc-700`}
          >
            Close
          </button>
        </div>

        <video ref={videoRef} src={take.url} controls className="max-h-[38vh] w-full rounded-lg bg-black" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Cut a flub:
          </span>
          {cutIn === null ? (
            <button type="button" onClick={markCutIn} disabled={exporting} className={`${btn} bg-amber-600/20 text-amber-300 hover:bg-amber-600/30`}>
              Mark cut start at playhead
            </button>
          ) : (
            <>
              <span className="text-xs text-amber-300">Cut starts {clock(cutIn)}</span>
              <button type="button" onClick={markCutOut} disabled={exporting} className={`${btn} bg-amber-600 text-white hover:bg-amber-500`}>
                Mark cut end at playhead
              </button>
              <button type="button" onClick={() => setCutIn(null)} disabled={exporting} className={`${btn} bg-zinc-800 text-zinc-400`}>
                Cancel
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Action slide:
          </span>
          <input
            value={slideText}
            onChange={(e) => setSlideText(e.target.value)}
            placeholder="e.g. Step 2: The magic part"
            disabled={exporting}
            className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={slideSeconds}
            onChange={(e) => setSlideSeconds(Number(e.target.value) || 2.5)}
            disabled={exporting}
            title="Slide duration in seconds"
            className="w-14 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
          />
          <button type="button" onClick={addSlide} disabled={exporting} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
            Insert at playhead
          </button>
        </div>

        {(cuts.length > 0 || slides.length > 0) && (
          <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
            {cuts.map((cut) => (
              <div key={cut.id} className="flex items-center justify-between text-xs text-zinc-300">
                <span>
                  ✂️ Cut {clock(cut.start)} to {clock(cut.end)}
                </span>
                <button
                  type="button"
                  onClick={() => setCuts((p) => p.filter((c) => c.id !== cut.id))}
                  disabled={exporting}
                  className="text-zinc-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
            {slides.map((slide) => (
              <div key={slide.id} className="flex items-center justify-between gap-2 text-xs text-zinc-300">
                <span className="truncate">
                  🪧 Slide at {clock(slide.at)}: “{slide.text}” ({slide.seconds}s)
                </span>
                <button
                  type="button"
                  onClick={() => setSlides((p) => p.filter((s) => s.id !== slide.id))}
                  disabled={exporting}
                  className="shrink-0 text-zinc-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-zinc-400">
            Final length: ~{Math.max(1, Math.round(outSeconds))}s
          </span>
          <button
            type="button"
            onClick={doExport}
            disabled={exporting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {exporting
              ? `Exporting… ${Math.round(progress.done)}s of ${Math.round(progress.total)}s`
              : "Export edited take"}
          </button>
        </div>
        {exporting && (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Exports run in real time (the video plays through once). Keep
              this tab visible until it finishes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
