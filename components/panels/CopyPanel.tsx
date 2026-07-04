"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { SocialCopy } from "@/lib/fallbacks";
import { apiKeyHeaders } from "@/lib/user-keys";

interface CopyPanelProps {
  /** Prefilled from the last AI diagram concept */
  seedConcept: string;
  script: string;
}

function CopyRow({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied");
      }}
      title="Click to copy"
      className="block w-full rounded-md bg-zinc-900 px-2.5 py-1.5 text-left text-xs leading-snug text-zinc-300 transition-colors hover:bg-zinc-800"
    >
      {text}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function CopyPanel({ seedConcept, script }: CopyPanelProps) {
  const [concept, setConcept] = useState(seedConcept);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(SocialCopy & { source?: string }) | null>(null);

  const generate = async () => {
    const trimmed = (concept || seedConcept).trim();
    if (!trimmed) {
      toast.error("Tell me what the video is about first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiKeyHeaders() },
        body: JSON.stringify({ concept: trimmed, script }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as SocialCopy & { source?: string };
      setResult(data);
      if (data.source === "offline") {
        toast.info("Built offline templates. Add an AI key under ⚙ Keys for tailored copy.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Couldn't generate copy. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          What’s the video about?
        </label>
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={seedConcept || "e.g. How DNS works"}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Writing your hooks…" : "Generate hooks, titles + descriptions"}
        </button>
      </div>

      {result ? (
        <div className="flex-1 space-y-4 overflow-y-auto pb-2">
          <Section title="Hooks">
            {result.hooks.map((h, i) => (
              <CopyRow key={i} text={h} />
            ))}
          </Section>
          <Section title="Titles">
            {result.titles.map((t, i) => (
              <CopyRow key={i} text={t} />
            ))}
          </Section>
          <Section title="YouTube description">
            <CopyRow text={result.descriptions.youtube} />
          </Section>
          <Section title="Short-form caption">
            <CopyRow text={result.descriptions.shortform} />
          </Section>
          <Section title="LinkedIn post">
            <CopyRow text={result.descriptions.linkedin} />
          </Section>
          <Section title="Hashtags">
            <CopyRow text={result.hashtags.join(" ")} />
          </Section>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-500">
          After you record, generate hooks, titles, and platform-ready
          descriptions here. Everything is one click to copy. Uses your script
          from the Script tab for extra context when it’s filled in.
        </p>
      )}
    </div>
  );
}
