"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { Take } from "./panels/TakesPanel";
import { extractWavFromTake } from "@/lib/audio-extract";
import { apiKeyHeaders } from "@/lib/user-keys";
import { getBrandKit, saveBrandKit } from "@/lib/brand-kit";
import { useCreatorCloud } from "@/components/useCreatorCloud";
import { FORMAT_KEYS, FORMATS, type FormatKey } from "@/lib/formats";
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
  onExported: (result: EditedExport, format: FormatKey) => void;
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
  const [workspaceTab, setWorkspaceTab] = useState<"edit" | "export">("edit");
  const [exportFormat, setExportFormat] = useState<FormatKey>(take.format as FormatKey);

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
    if (cuts.length === 0 && slides.length === 0 && exportFormat === take.format) {
      toast.error("Choose a new format, add an edit, or download the original");
      return;
    }
    setExporting(true);
    try {
      const result = await exportEditedTake({
        sourceUrl: take.url,
        format: exportFormat,
        duration,
        cuts,
        slides,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      onExported(result, exportFormat);
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
    <div className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-[#090a0f] text-white">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#0b0c11] px-3 sm:px-5">
        <button type="button" onClick={onClose} disabled={exporting} aria-label="Close editor" className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04] text-white/48 hover:bg-white/[0.08] hover:text-white disabled:opacity-40">
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round"><path d="m12.5 5-5 5 5 5"/></svg>
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white">Edit take</h2>
          <p className="mt-0.5 text-[10px] text-white/30">{take.format} · {Math.round(duration)}s · edits stay local</p>
        </div>
        <div className="mx-auto hidden rounded-full border border-white/[0.07] bg-white/[0.035] p-1 sm:flex">
          {(["edit", "export"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setWorkspaceTab(tab)} disabled={exporting} className={`min-h-8 rounded-full px-5 text-xs font-semibold capitalize transition ${workspaceTab === tab ? "bg-white text-[#111116]" : "text-white/38 hover:text-white"}`}>{tab}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs tabular-nums text-white/34 md:inline">Final ~{Math.max(1, Math.round(outSeconds))}s</span>
          <button type="button" onClick={() => setWorkspaceTab("export")} disabled={exporting} className="min-h-10 rounded-full bg-[#7657ff] px-4 text-xs font-semibold text-white hover:bg-[#876dff] disabled:opacity-40">Export</button>
        </div>
      </header>

      <div className="grid grid-cols-2 border-b border-white/[0.07] bg-[#0b0c11] p-1.5 sm:hidden">
        {(["edit", "export"] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setWorkspaceTab(tab)} disabled={exporting} className={`min-h-10 rounded-xl text-xs font-semibold capitalize ${workspaceTab === tab ? "bg-white/[0.09] text-white" : "text-white/35"}`}>{tab}</button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
        <section className="flex min-h-[250px] flex-col border-b border-white/[0.07] bg-black lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5 lg:p-8">
            <video ref={videoRef} src={take.url} controls playsInline className="max-h-full w-full rounded-xl bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]" />
          </div>
          <div className="shrink-0 border-t border-white/[0.07] bg-[#0c0d12] px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/28">
              <span>{cuts.length} {cuts.length === 1 ? "cut" : "cuts"} · {slides.length} {slides.length === 1 ? "slide" : "slides"}</span>
              <span>{clock(outSeconds)} output</span>
            </div>
            {(cuts.length > 0 || slides.length > 0) && (
              <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
                {cuts.map((cut) => <span key={cut.id} className="shrink-0 rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-200">Cut {clock(cut.start)}–{clock(cut.end)}</span>)}
                {slides.map((slide) => <span key={slide.id} className="max-w-44 shrink-0 truncate rounded-full bg-[#7657ff]/14 px-2.5 py-1 text-[10px] text-[#b6a8ff]">Slide · {slide.text}</span>)}
              </div>
            )}
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-[#111218]">
          {workspaceTab === "edit" ? (
            <div className="space-y-7 p-4 sm:p-6 lg:p-7">
              <section>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9d88ff]">Transcript editor</p><h3 className="mt-1.5 text-xl font-semibold tracking-[-0.025em]">Cut the words you do not want</h3></div>
                  {words === null && <button type="button" onClick={loadTranscript} disabled={loadingWords || exporting} className={`${btn} shrink-0 bg-[#7657ff] text-white hover:bg-[#876dff]`}>{loadingWords ? "Transcribing…" : "Load transcript"}</button>}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/35">Transcript generation uses your configured provider or Creator Cloud. Manual cuts work without either.</p>
                {words && (
                  <>
                    <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-white/[0.07] bg-black/20 p-3 leading-8">
                      {words.map((word, index) => (
                        <button key={`${index}_${word.start}`} type="button" onClick={() => clickWord(index)} disabled={exporting} className={`mr-0.5 rounded px-0.5 text-sm transition-colors ${isWordCut(word) ? "text-white/18 line-through" : isSelected(index) ? "bg-[#7657ff] text-white" : FILLER_RE.test(word.word) ? "text-amber-300 hover:bg-white/[0.06]" : "text-white/64 hover:bg-white/[0.06]"}`}>{word.word}</button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={removeFillers} disabled={exporting} className={`${btn} bg-amber-300/10 text-amber-200 hover:bg-amber-300/15`}>Remove filler words</button>
                      {effectiveRange && <button type="button" onClick={cutSelectedWords} disabled={exporting} className={`${btn} bg-amber-500 text-white hover:bg-amber-400`}>Cut selected</button>}
                      {effectiveRange && <button type="button" onClick={() => { setAnchor(null); setSelRange(null); }} disabled={exporting} className={`${btn} bg-white/[0.06] text-white/42 hover:text-white`}>Clear selection</button>}
                    </div>
                  </>
                )}
              </section>

              <section className="border-t border-white/[0.07] pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/32">Manual cut</p>
                <h3 className="mt-1.5 text-base font-semibold">Mark a rough moment from the playhead</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {cutIn === null ? <button type="button" onClick={markCutIn} disabled={exporting} className={`${btn} bg-amber-300/10 text-amber-200 hover:bg-amber-300/15`}>Mark cut start</button> : <><span className="text-xs text-amber-200">Started at {clock(cutIn)}</span><button type="button" onClick={markCutOut} disabled={exporting} className={`${btn} bg-amber-500 text-white hover:bg-amber-400`}>Mark cut end</button><button type="button" onClick={() => setCutIn(null)} disabled={exporting} className={`${btn} bg-white/[0.06] text-white/42`}>Cancel</button></>}
                </div>
              </section>

              <section className="border-t border-white/[0.07] pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/32">Action slide</p>
                <h3 className="mt-1.5 text-base font-semibold">Add a clear beat at the playhead</h3>
                <div className="mt-3 grid grid-cols-[1fr_72px] gap-2">
                  <input value={slideText} onChange={(event) => setSlideText(event.target.value)} placeholder="e.g. Step 2: The magic part" disabled={exporting} className="min-h-11 min-w-0 rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/22 focus:border-[#7657ff]" />
                  <input type="number" min={1} max={10} step={0.5} value={slideSeconds} onChange={(event) => setSlideSeconds(Number(event.target.value) || 2.5)} disabled={exporting} title="Slide duration in seconds" className="min-h-11 rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white" />
                </div>
                <button type="button" onClick={addSlide} disabled={exporting} className="mt-2 min-h-10 rounded-full bg-[#7657ff] px-4 text-xs font-semibold text-white hover:bg-[#876dff]">Insert at playhead</button>
                {account.plan === "creator" ? <div className="mt-4 grid grid-cols-[44px_1fr] gap-2 rounded-xl border border-[#7657ff]/18 bg-[#7657ff]/[0.055] p-3"><input type="color" value={brandKit.accent} onChange={(event) => setBrandKit((current) => ({ ...current, accent: event.target.value }))} disabled={exporting} aria-label="Action slide accent color" className="h-10 w-10 cursor-pointer rounded border-0 bg-transparent" /><input value={brandKit.signature} maxLength={50} onChange={(event) => setBrandKit((current) => ({ ...current, signature: event.target.value }))} placeholder="Brand or creator name" disabled={exporting} className="min-w-0 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-xs text-white outline-none" /></div> : <p className="mt-3 text-[11px] leading-5 text-white/28">Creator Cloud can save an accent color and signature on new action slides.</p>}
              </section>

              {(cuts.length > 0 || slides.length > 0) && (
                <section className="border-t border-white/[0.07] pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/32">Edit list</p>
                  <div className="mt-3 space-y-2">
                    {cuts.map((cut) => <div key={cut.id} className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3 py-2 text-xs text-white/58"><span>Cut {clock(cut.start)} to {clock(cut.end)}</span><button type="button" onClick={() => setCuts((current) => current.filter((item) => item.id !== cut.id))} disabled={exporting} className="text-white/28 hover:text-red-300">Remove</button></div>)}
                    {slides.map((slide) => <div key={slide.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-xs text-white/58"><span className="truncate">Slide at {clock(slide.at)} · “{slide.text}”</span><button type="button" onClick={() => setSlides((current) => current.filter((item) => item.id !== slide.id))} disabled={exporting} className="shrink-0 text-white/28 hover:text-red-300">Remove</button></div>)}
                  </div>
                </section>
              )}

              <button type="button" onClick={() => setWorkspaceTab("export")} className="min-h-12 w-full rounded-full bg-white text-sm font-semibold text-[#111116] hover:bg-white/90">Continue to export</button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 lg:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9d88ff]">Export take</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Choose where it will live</h3>
              <p className="mt-2 text-sm leading-6 text-white/38">Sketchcast re-renders the edited take locally in your browser.</p>

              <div className="mt-6 space-y-2">
                {FORMAT_KEYS.map((key) => {
                  const spec = FORMATS[key];
                  const active = exportFormat === key;
                  return <button key={key} type="button" onClick={() => setExportFormat(key)} disabled={exporting} className={`flex min-h-[78px] w-full items-center gap-4 rounded-2xl border p-3 text-left transition ${active ? "border-[#7657ff]/60 bg-[#7657ff]/12" : "border-white/[0.07] bg-white/[0.025] hover:border-white/15"}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${active ? "border-[#9d88ff]/35 bg-[#7657ff]/16 text-[#b6a8ff]" : "border-white/[0.07] bg-black/20 text-white/28"}`}><span style={{ aspectRatio: `${spec.width}/${spec.height}` }} className="block h-7 max-w-8 rounded-sm border border-current" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{spec.label}</span><span className="mt-1 block truncate text-xs text-white/32">{spec.hint}</span></span>{active && <span className="text-emerald-300">✓</span>}</button>;
                })}
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-2">
                {[ ["Final length", clock(outSeconds)], ["Edits", String(cuts.length + slides.length)], ["Output", exportFormat] ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">{label}</dt><dd className="mt-1.5 text-sm font-semibold text-white/68">{value}</dd></div>)}
              </dl>

              <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.045] p-3 text-xs leading-5 text-emerald-50/55"><strong className="text-emerald-300">Local export.</strong> The video is processed on this device and added to your Recovery Vault.</div>

              {exporting && <div className="mt-5 space-y-2"><div className="h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full bg-[#7657ff] transition-all" style={{ width: `${progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0}%` }} /></div><p className="text-[11px] leading-5 text-white/34">Exporting {Math.round(progress.done)}s of {Math.round(progress.total)}s. Keep this tab visible until it finishes.</p></div>}

              <button type="button" onClick={doExport} disabled={exporting} className="mt-6 min-h-12 w-full rounded-full bg-[#7657ff] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(118,87,255,0.2)] hover:bg-[#876dff] disabled:opacity-45">{exporting ? "Exporting locally…" : `Export ${exportFormat} take`}</button>
              <a href={take.url} download={take.filename} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full text-xs font-semibold text-white/38 hover:bg-white/[0.045] hover:text-white">Download original instead</a>
              <p className="mt-4 text-center text-[10px] leading-5 text-white/22">Export runs in real time because the edited video is replayed and re-recorded in your browser.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
