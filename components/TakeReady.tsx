"use client";

import type { Take } from "./panels/TakesPanel";

interface TakeReadyProps {
  take: Take;
  onEdit: () => void;
  onRecordAgain: () => void;
  onDone: () => void;
}

function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function TakeReady({ take, onEdit, onRecordAgain, onDone }: TakeReadyProps) {
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#090a0f]/96 p-4 backdrop-blur-xl sm:p-6 lg:p-10">
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#111218] shadow-[0_40px_120px_rgba(0,0,0,0.65)] lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
          <div className="flex min-h-[300px] items-center bg-black p-3 sm:p-5 lg:min-h-[620px]">
            <video src={take.url} controls autoPlay playsInline className="max-h-[72dvh] w-full rounded-2xl bg-black" />
          </div>
          <div className="flex flex-col justify-between border-t border-white/[0.07] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/12 text-lg text-emerald-300">✓</span>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-300">Take ready</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Nice. You got it.</h2>
              <p className="mt-3 text-sm leading-6 text-white/40">Review the take, clean any rough moments, or download the original now.</p>

              <dl className="mt-7 grid grid-cols-3 gap-2">
                {[
                  ["Length", clock(take.seconds)],
                  ["Format", take.format],
                  ["Size", `${take.sizeMB.toFixed(1)} MB`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/26">{label}</dt>
                    <dd className="mt-1.5 text-sm font-semibold text-white/72">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className={`mt-5 flex gap-2 rounded-xl border p-3 text-xs leading-5 ${take.persisted ? "border-emerald-400/10 bg-emerald-400/[0.045] text-emerald-100/55" : "border-amber-300/15 bg-amber-300/[0.055] text-amber-100/60"}`}>
                <span className="mt-0.5">{take.persisted ? "◆" : "…"}</span>
                <span>{take.persisted ? "Saved to the Recovery Vault on this device." : "Saving locally. Keep this tab open or download the original now."}</span>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button type="button" onClick={onEdit} className="min-h-12 w-full rounded-full bg-[#7657ff] px-5 text-sm font-semibold text-white hover:bg-[#876dff]">Edit this take</button>
              <a href={take.url} download={take.filename} className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white/68 hover:bg-white/[0.06] hover:text-white">Download original</a>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={onRecordAgain} className="min-h-11 rounded-full text-xs font-semibold text-white/46 hover:bg-white/[0.05] hover:text-white">Record again</button>
                <button type="button" onClick={onDone} className="min-h-11 rounded-full text-xs font-semibold text-white/46 hover:bg-white/[0.05] hover:text-white">Back to Studio</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
