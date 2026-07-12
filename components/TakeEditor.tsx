"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { Take } from "./panels/TakesPanel";
import { extractWavFromTake } from "@/lib/audio-extract";
import { apiKeyHeaders } from "@/lib/user-keys";
import { getBrandKit, saveBrandKit } from "@/lib/brand-kit";
import { useCreatorCloud } from "@/components/useCreatorCloud";
import type { FormatKey } from "@/lib/formats";
import {
  buildSequence,
  exportEditedTake,
  sequenceDuration,
  type ActionSlide,
  type CutRegion,
  type EditedExport,
} from "@/lib/take-editor";

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

const FILLER_RE = /^(um+|uh+|uhm+|erm+|hmm+)[,.!?…]?$/i;
const WORD_PAD = 0.04;

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
  const { account } = useCreatorCloud();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cuts, setCuts] = useState<CutRegion[]>([]);
  const [slides, setSlides] = useState<ActionSlide[]>([]);
  const [cutIn, setCutIn] = useState<number | null>(null);
  const [slideText, setSlideText] = useState("");
  const [slideSeconds, setSlideSeconds] = useState(2.5);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [words, setWords] = useState<TranscriptWord[] | null>(null);
  const [loadingWords, setLoadingWords] = useState(false);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [selRange, setSelRange] = useState<[number, number] | null>(null);
  const [brandKit, setBrandKit] = useState(() => getBrandKit());

  const now = () => videoRef.current?.currentTime ?? 0;
  const duration = take.seconds;
  const outSeconds = sequenceDuration(buildSequence(duration, cuts, slides));

  const isWordCut = (word: TranscriptWord) =>
    cuts.some((c) => word.start >= c.start - 0.02 && word.end <= c.end + 0.02);

  const loadTranscript = async () => {
    setLoadingWords(true);
    try {
      const wav = await extractWavFromTake(take.url);
      // Hosting platforms cap upload bodies around 4.5 MB, roughly a
      // 2-minute take at 16 kHz mono
      if (wav.size > 4_000_000) {
        toast.error(
          "Hosted transcripts are limited to takes of about 2 minutes. Use the manual cut buttons for longer takes."
        );
        return;
      }
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "audio/wav", ...apiKeyHeaders() },
        body: wav,
      });
      if (res.status === 501) {
        toast.info(
          "Transcript editing needs a Deepgram key or Creator Cloud. Add a key under ⚙ Keys or view the hosted plan."
        );
        return;
      }
      if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
      const data = (await res.json()) as { words: TranscriptWord[] };
      if (data.words.length === 0) {
        toast.info("No speech detected in this take.");
        return;
      }
      setWords(data.words);
      toast.success("Transcript ready. Click a word, then the last word to cut.");
    } catch (error) {
      console.error(error);
      toast.error(
        "Couldn't read audio from this take. Board-only takes have no audio track."
      );
    } finally {
      setLoadingWords(false);
    }
  };

  const clickWord = (index: number) => {
    if (!words) return;
    const video = videoRef.current;
    if (video) video.currentTime = words[index].start;
    if (anchor === null) {
      setAnchor(index);
      setSelRange(null);
    } else {
      setSelRange([Math.min(anchor, index), Math.max(anchor, index)]);
      setAnchor(null);
    }
  };

  const effectiveRange: [number, number] | null =
    selRange ?? (anchor !== null ? [anchor, anchor] : null);

  const cutSelectedWords = () => {
    if (!words || !effectiveRange) return;
    const [a, b] = effectiveRange;
    const start = Math.max(0, words[a].start - WORD_PAD);
    const end = Math.min(duration, words[b].end + WORD_PAD);
    setCuts((prev) =>
      [...prev, { id: `cut_${Date.now()}`, start, end }].sort(
        (x, y) => x.start - y.start
      )
    );
    setAnchor(null);
    setSelRange(null);
    toast.success(`Cut ${b - a + 1} word${b - a === 0 ? "" : "s"}`);
  };

  const removeFillers = () => {
    if (!words) return;
    const fillers = words.filter((w) => FILLER_RE.test(w.word) && !isWordCut(w));
    if (fillers.length === 0) {
      toast.info("No filler words found. Clean take!");
      return;
    }
    setCuts((prev) =>
      [
        ...prev,
        ...fillers.map((w, i) => ({
          id: `cut_filler_${Date.now()}_${i}`,
          start: Math.max(0, w.start - 0.03),
          end: Math.min(duration, w.end + 0.03),
        })),
      ].sort((x, y) => x.start - y.start)
    );
    toast.success(`Removed ${fillers.length} filler word${fillers.length === 1 ? "" : "s"}`);
  };

  const isSelected = (index: number) =>
    effectiveRange !== null &&
    index >= effectiveRange[0] &&
    index <= effectiveRange[1];

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
        {
          id: `slide_${Date.now()}`,
          at: now(),
          text,
          seconds: slideSeconds,
          brand: account.plan === "creator" ? saveBrandKit(brandKit) : undefined,
        },
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

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Transcript:
            </span>
            {words === null ? (
              <button
                type="button"
                onClick={loadTranscript}
                disabled={loadingWords || exporting}
                className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}
              >
                {loadingWords ? "Transcribing…" : "Load transcript"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={removeFillers}
                  disabled={exporting}
                  className={`${btn} bg-amber-600/20 text-amber-300 hover:bg-amber-600/30`}
                >
                  Remove filler words
                </button>
                {effectiveRange && (
                  <>
                    <button
                      type="button"
                      onClick={cutSelectedWords}
                      disabled={exporting}
                      className={`${btn} bg-amber-600 text-white hover:bg-amber-500`}
                    >
                      Cut selected
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnchor(null);
                        setSelRange(null);
                      }}
                      disabled={exporting}
                      className={`${btn} bg-zinc-800 text-zinc-400`}
                    >
                      Clear
                    </button>
                  </>
                )}
                <span className="text-[11px] text-zinc-500">
                  Click the first and last word of a flub, then cut.
                </span>
              </>
            )}
          </div>
          {words && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 leading-7">
              {words.map((w, i) => (
                <button
                  key={`${i}_${w.start}`}
                  type="button"
                  onClick={() => clickWord(i)}
                  disabled={exporting}
                  className={`mr-0.5 rounded px-0.5 text-xs transition-colors ${
                    isWordCut(w)
                      ? "text-zinc-600 line-through"
                      : isSelected(i)
                        ? "bg-indigo-600 text-white"
                        : FILLER_RE.test(w.word)
                          ? "text-amber-300 hover:bg-zinc-800"
                          : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {w.word}
                </button>
              ))}
            </div>
          )}
        </div>

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

        {account.plan === "creator" ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300">Brand kit</span>
            <input type="color" value={brandKit.accent} onChange={(event) => setBrandKit((current) => ({ ...current, accent: event.target.value }))} disabled={exporting} aria-label="Action slide accent color" className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" />
            <input value={brandKit.signature} maxLength={50} onChange={(event) => setBrandKit((current) => ({ ...current, signature: event.target.value }))} placeholder="Brand or creator name" disabled={exporting} className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none" />
            <span className="text-[11px] text-zinc-500">Applied to new action slides.</span>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500">
            Creator Cloud can save your accent color and signature on action slides.
          </p>
        )}

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
