"use client";

export interface Take {
  id: string;
  url: string;
  filename: string;
  sizeMB: number;
  seconds: number;
  format: string;
  persisted: boolean;
}

interface TakesPanelProps {
  takes: Take[];
  onDelete: (id: string) => void;
  onEdit: (take: Take) => void;
}

export default function TakesPanel({ takes, onDelete, onEdit }: TakesPanelProps) {
  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      {takes.length === 0 && (
        <p className="text-xs leading-relaxed text-zinc-500">
          Finished recordings land in the Recovery Vault here. They stay on
          this device through refreshes and browser restarts until you delete them.
        </p>
      )}
      {takes.map((take) => (
        <div
          key={take.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5"
        >
          <video src={take.url} controls className="mb-2 w-full rounded-md bg-black" />
          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span className="tabular-nums">
              {take.format} · {Math.round(take.seconds)}s · {take.sizeMB.toFixed(1)}&nbsp;MB
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                take.persisted
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-300"
              }`}
            >
              {take.persisted ? "Recovered locally" : "Saving…"}
            </span>
            <div className="flex gap-1.5">
              <a
                href={take.url}
                download={take.filename}
                className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Download
              </a>
              <button
                type="button"
                onClick={() => onEdit(take)}
                title="Cut flubs and insert action slides"
                className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(take.id)}
                className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-red-900/40 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
