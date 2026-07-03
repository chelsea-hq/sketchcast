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
  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

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
    <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-2.5">
      {/* Session + device toggles */}
      <div className="flex items-center gap-1.5">
        {hasSession ? (
          <>
            <button
              type="button"
              onClick={onToggleCam}
              className={`${pill} ${camOn ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800 text-zinc-400"}`}
            >
              {camOn ? "Cam on" : "Cam off"}
            </button>
            <button
              type="button"
              onClick={onToggleMic}
              className={`${pill} ${micOn ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800 text-zinc-400"}`}
            >
              {micOn ? "Mic on" : "Mic off"}
            </button>
            <button
              type="button"
              onClick={onEndSession}
              disabled={recording}
              className={`${pill} bg-zinc-800 text-zinc-400 hover:bg-zinc-700`}
            >
              End session
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStartSession}
            className={`${pill} bg-indigo-600 text-white hover:bg-indigo-500`}
          >
            Start session · camera + mic
          </button>
        )}
      </div>

      {/* Record controls */}
      <div className="flex items-center gap-2">
        {recState === "idle" && (
          <button
            type="button"
            onClick={onRecord}
            className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            Record
          </button>
        )}
        {recState === "recording" && (
          <>
            <button type="button" onClick={onPause} className={`${pill} bg-zinc-800 text-zinc-200 hover:bg-zinc-700`}>
              Pause
            </button>
            <button
              type="button"
              onClick={onStop}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
            >
              Stop &amp; save
            </button>
          </>
        )}
        {recState === "paused" && (
          <>
            <button type="button" onClick={onResume} className={`${pill} bg-emerald-600 text-white hover:bg-emerald-500`}>
              Resume
            </button>
            <button
              type="button"
              onClick={onStop}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
            >
              Stop &amp; save
            </button>
          </>
        )}
        <span
          className={`font-mono text-sm tabular-nums ${recording ? "text-red-400" : "text-zinc-500"}`}
        >
          {formatClock(elapsed)}
        </span>
      </div>

      {/* Format switcher */}
      <div className="flex items-center gap-1">
        {FORMAT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={recording}
            onClick={() => onFormatChange(key)}
            title={FORMATS[key].hint}
            className={`${pill} ${
              format === key
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {FORMATS[key].label}
          </button>
        ))}
        <span className="ml-1 hidden text-[11px] text-zinc-500 lg:inline">
          {FORMATS[format].hint}
        </span>
      </div>

      {/* Webcam size + prompter */}
      <div className="ml-auto flex items-center gap-3">
        {hasSession && (
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            Webcam size
            <input
              type="range"
              min={0.12}
              max={0.45}
              step={0.01}
              value={webcam.sizeFrac}
              onChange={(e) => onWebcamSize(Number(e.target.value))}
              className="w-20 accent-indigo-500"
            />
          </label>
        )}
        <button
          type="button"
          onClick={onTogglePrompter}
          className={`${pill} ${
            prompterVisible
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Prompter
        </button>
      </div>
    </div>
  );
}
