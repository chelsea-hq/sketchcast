"use client";

import { useState } from "react";
import { toast } from "sonner";

import { apiKeyHeaders } from "@/lib/user-keys";

interface DiagramResult {
  mermaid: string;
  talkTrack: string[];
  source: "claude" | "offline";
}

interface DiagramEntry {
  id: string;
  concept: string;
  result: DiagramResult;
}

interface AiPanelProps {
  onInsert: (mermaid: string) => Promise<boolean>;
  onSaveToTray: (mermaid: string, name: string) => Promise<boolean>;
  onConceptUsed: (concept: string) => void;
}

export default function AiPanel({
  onInsert,
  onSaveToTray,
  onConceptUsed,
}: AiPanelProps) {
  const [concept, setConcept] = useState("");
  const [busy, setBusy] = useState(false);
  const [inserting, setInserting] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiagramEntry[]>([]);

  const generate = async () => {
    const trimmed = concept.trim();
    if (!trimmed) {
      toast.error("Type the concept you want diagrammed first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiKeyHeaders() },
        body: JSON.stringify({ concept: trimmed }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const result = (await res.json()) as DiagramResult;
      setEntries((prev) => [
        { id: `d_${Date.now()}`, concept: trimmed, result },
        ...prev,
      ]);
      onConceptUsed(trimmed);
      if (result.source === "offline") {
        toast.info(
          "Built offline (no Claude key found). Add ANTHROPIC_API_KEY for smarter diagrams."
        );
      } else {
        toast.success("Diagram ready. Add it to the board.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Couldn't generate a diagram. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const insert = async (entry: DiagramEntry) => {
    setInserting(entry.id);
    const ok = await onInsert(entry.result.mermaid);
    setInserting(null);
    if (ok) toast.success("Added to the whiteboard. Drag pieces as you talk.");
  };

  const stash = async (entry: DiagramEntry) => {
    setInserting(entry.id);
    const ok = await onSaveToTray(entry.result.mermaid, entry.concept);
    setInserting(null);
    if (ok) {
      toast.success(
        "Saved to the tray (Library panel on the board). Drag it on while you record; viewers never see the panel."
      );
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Concept to explain
        </label>
        <textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          rows={3}
          placeholder="e.g. How DNS resolves a domain name, step by step"
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Sketching your diagram…" : "Generate diagram"}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {entries.length === 0 && (
          <p className="text-xs leading-relaxed text-zinc-500">
            Describe the idea you’re teaching and get a ready-made whiteboard
            layout: boxes, arrows, and a talk track. “Add to board” drops it
            on now; “Save to tray” stages it in the board’s Library panel so
            you can drag it on mid-recording, Canva-style. Viewers never see
            the panel, only what lands on the board.
          </p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <p className="text-xs font-medium text-zinc-300">{entry.concept}</p>
            <ul className="mt-2 space-y-1">
              {entry.result.talkTrack.map((beat, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] text-zinc-500">
                  <span className="text-indigo-400">{i + 1}.</span>
                  {beat}
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => insert(entry)}
                disabled={inserting === entry.id}
                className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {inserting === entry.id ? "Adding…" : "Add to board"}
              </button>
              <button
                type="button"
                onClick={() => stash(entry)}
                disabled={inserting === entry.id}
                title="Stage it in the board's Library panel and drag it on while recording"
                className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                Save to tray
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(entry.result.mermaid);
                  toast.success("Mermaid code copied");
                }}
                className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
