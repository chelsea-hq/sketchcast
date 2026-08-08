"use client";

import { FORMAT_KEYS, FORMATS, type FormatKey, type WebcamLayout } from "@/lib/formats";

export type RecState = "idle" | "recording" | "paused";

interface RecordBarProps {
  hasSession: boolean;
  camOn: boolean;
  micOn: boolean;
  recState: RecState;
  elapsed: number;
  format: FormatKey;
  webcam: WebcamLayout;
  prompterVisible: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onFormatChange: (format: FormatKey) => void;
  onWebcamSize: (sizeFrac: number) => void;
  onTogglePrompter: () => void;
  onRecord: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const pill =
  "inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

export default function RecordBar({
  hasSession,
  camOn,
  micOn,
  recState,
  elapsed,
  format,
  webcam,
  prompterVisible,
  onStartSession,
  onEndSession,
  onToggleCam,
  onToggleMic,
  onFormatChange,
  onWebcamSize,
  onTogglePrompter,
  onRecord,
  onPause,
  onResume,
  onStop,
}: RecordBarProps) {
  const recording = recState !== "idle";

  return (
    <>
      <div className="flex min-h-12 shrink-0 items-center justify-between border-t border-white/[0.07] bg-[#0b0c11] px-3 md:hidden">
        <span className="flex items-center gap-2 text-[11px] font-medium text-white/52">
          <span className="h-2 w-2 rounded-full bg-[#d8ff6f] shadow-[0_0_10px_rgba(216,255,111,0.55)]" />
          Mobile prep mode
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/28">Record on desktop</span>
      </div>
      <div className="hidden shrink-0 flex-wrap items-center gap-2 border-t border-white/[0.07] bg-[#0b0c11] px-3 py-2.5 md:flex xl:flex-nowrap xl:gap-3 xl:px-4">
      {/* Session + device toggles */}
      <div className="flex items-center gap-1.5">
        {hasSession ? (
          <>
            <button
              type="button"
              onClick={onToggleCam}
              className={`${pill} ${camOn ? "border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300" : "border-white/[0.07] bg-white/[0.04] text-white/40"}`}
            >
              {camOn ? "Cam on" : "Cam off"}
            </button>
            <button
              type="button"
              onClick={onToggleMic}
              className={`${pill} ${micOn ? "border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300" : "border-white/[0.07] bg-white/[0.04] text-white/40"}`}
            >
              {micOn ? "Mic on" : "Mic off"}
            </button>
            <button
              type="button"
              onClick={onEndSession}
              disabled={recording}
              className={`${pill} border-white/[0.07] bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70`}
            >
              End session
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStartSession}
            className={`${pill} border-[#7657ff]/30 bg-[#7657ff]/15 text-[#b6a8ff] hover:bg-[#7657ff]/25 hover:text-white`}
          >
            <span className="mr-1.5 h-2 w-2 rounded-full bg-[#9d88ff]" />
            Start camera + mic
          </button>
        )}
      </div>

      <span className="hidden h-6 w-px bg-white/[0.08] xl:block" aria-hidden />

      {/* Record controls */}
      <div className="flex items-center gap-2">
        {recState === "idle" && (
          <button
            type="button"
            onClick={onRecord}
            className="flex min-h-10 items-center gap-2 rounded-full bg-[#f04456] px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(240,68,86,0.18)] transition hover:bg-[#ff5566]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            Record
          </button>
        )}
        {recState === "recording" && (
          <>
            <button type="button" onClick={onPause} className={`${pill} border-white/[0.07] bg-white/[0.05] text-white/70 hover:bg-white/[0.09]`}>
              Pause
            </button>
            <button
              type="button"
              onClick={onStop}
              className="min-h-10 rounded-full bg-[#f04456] px-4 text-sm font-semibold text-white transition hover:bg-[#ff5566]"
            >
              Stop &amp; save
            </button>
          </>
        )}
        {recState === "paused" && (
          <>
            <button type="button" onClick={onResume} className={`${pill} border-emerald-400/20 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25`}>
              Resume
            </button>
            <button
              type="button"
              onClick={onStop}
              className="min-h-10 rounded-full bg-[#f04456] px-4 text-sm font-semibold text-white transition hover:bg-[#ff5566]"
            >
              Stop &amp; save
            </button>
          </>
        )}
        <span
          className={`min-w-[3.2rem] font-mono text-xs tabular-nums ${recording ? "text-red-300" : "text-white/28"}`}
        >
          {formatClock(elapsed)}
        </span>
      </div>

      {/* Format switcher */}
      <div className="ml-auto flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.035] p-1 xl:ml-0">
        {FORMAT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={recording}
            onClick={() => onFormatChange(key)}
            title={FORMATS[key].hint}
            className={`inline-flex min-h-8 items-center rounded-full px-2.5 text-[11px] font-semibold transition disabled:opacity-40 ${
              format === key
                ? "bg-white text-[#111116]"
                : "text-white/38 hover:bg-white/[0.06] hover:text-white/70"
            }`}
          >
            {FORMATS[key].label}
          </button>
        ))}
        <span className="ml-1 hidden pr-2 text-[10px] text-white/28 2xl:inline">
          {FORMATS[format].hint}
        </span>
      </div>

      {/* Webcam size + prompter */}
      <div className="flex items-center gap-2 xl:ml-auto">
        {hasSession && (
          <label className="hidden items-center gap-1.5 text-[10px] text-white/38 2xl:flex">
            Webcam size
            <input
              type="range"
              min={0.12}
              max={0.45}
              step={0.01}
              value={webcam.sizeFrac}
              onChange={(e) => onWebcamSize(Number(e.target.value))}
              className="w-20 accent-[#7657ff]"
            />
          </label>
        )}
        <button
          type="button"
          onClick={onTogglePrompter}
          className={`${pill} ${
            prompterVisible
              ? "border-[#d8ff6f]/20 bg-[#d8ff6f]/10 text-[#d8ff6f]"
              : "border-white/[0.07] bg-white/[0.04] text-white/42 hover:bg-white/[0.08] hover:text-white/70"
          }`}
        >
          Prompter
        </button>
      </div>
      </div>
    </>
  );
}
