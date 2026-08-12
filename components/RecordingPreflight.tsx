"use client";

import { canBeginRecording, getRecordingReadiness } from "@/lib/creator-flow";
import { FORMAT_KEYS, FORMATS, type FormatKey } from "@/lib/formats";

interface RecordingPreflightProps {
  recoveryReady: boolean;
  boardReady: boolean;
  hasSession: boolean;
  camOn: boolean;
  micOn: boolean;
  hasScript: boolean;
  format: FormatKey;
  onFormatChange: (format: FormatKey) => void;
  onStartSession: () => void;
  onClose: () => void;
  onStartCountdown: () => void;
}

export default function RecordingPreflight({
  recoveryReady,
  boardReady,
  hasSession,
  camOn,
  micOn,
  hasScript,
  format,
  onFormatChange,
  onStartSession,
  onClose,
  onStartCountdown,
}: RecordingPreflightProps) {
  const items = getRecordingReadiness({
    recoveryReady,
    boardReady,
    hasSession,
    camOn,
    micOn,
    hasScript,
    format,
  });
  const ready = canBeginRecording(items);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="preflight-title" className="w-full max-w-[620px] overflow-hidden rounded-[26px] border border-white/10 bg-[#111218] shadow-[0_30px_100px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9d88ff]">Recording preflight</p>
            <h2 id="preflight-title" className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white">Ready when you are</h2>
            <p className="mt-2 text-sm leading-6 text-white/38">Check the frame and devices. Recording starts after a three-second countdown.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close preflight" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.055] text-white/45 hover:bg-white/10 hover:text-white">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_190px] sm:px-6 sm:py-6">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex min-h-[58px] items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.028] px-3.5 py-2.5">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  item.tone === "ready"
                    ? "bg-emerald-400/12 text-emerald-300"
                    : item.tone === "waiting"
                      ? "bg-amber-300/12 text-amber-200"
                      : "bg-white/[0.055] text-white/35"
                }`}>
                  {item.tone === "ready" ? "✓" : item.tone === "waiting" ? "…" : "○"}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white/78">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-white/32">{item.detail}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/32">Output format</p>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.07] bg-black/20 p-1 sm:grid-cols-1">
                {FORMAT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onFormatChange(key)}
                    className={`min-h-10 rounded-lg px-3 text-left text-xs font-semibold transition ${format === key ? "bg-white text-[#111116]" : "text-white/42 hover:bg-white/[0.05] hover:text-white"}`}
                  >
                    <span className="sm:flex sm:items-center sm:justify-between">
                      <span>{key}</span>
                      <span className="hidden text-[9px] font-normal opacity-45 sm:inline">{FORMATS[key].hint.split(",")[0]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!hasSession && (
              <button type="button" onClick={onStartSession} className="min-h-11 w-full rounded-xl border border-[#7657ff]/25 bg-[#7657ff]/12 px-3 text-xs font-semibold text-[#b6a8ff] hover:bg-[#7657ff]/22 hover:text-white">
                Connect camera + mic
              </button>
            )}
            <div className="rounded-xl border border-[#d8ff6f]/10 bg-[#d8ff6f]/[0.045] p-3 text-[11px] leading-5 text-white/42">
              <strong className="font-semibold text-[#d8ff6f]">Private by default.</strong> This recording is created and saved on this device.
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-center text-[11px] text-white/28 sm:text-left">{hasSession ? "Your enabled devices will be included." : "Board-only mode is ready."}</p>
          <button
            type="button"
            onClick={onStartCountdown}
            disabled={!ready}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f04456] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(240,68,86,0.2)] hover:bg-[#ff5566] disabled:cursor-wait disabled:opacity-40"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            {ready ? "Start recording" : "Finishing setup…"}
          </button>
        </div>
      </div>
    </div>
  );
}
