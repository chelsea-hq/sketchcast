"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { SketchProject } from "@/lib/recovery-vault";

interface SyncModalProps {
  project: SketchProject;
  onClose: () => void;
  onPush: () => Promise<string>;
  onPull: (code: string) => Promise<void>;
}

export default function SyncModal({ project, onClose, onPush, onPull }: SyncModalProps) {
  const [code, setCode] = useState(project.syncCode ?? "");
  const [working, setWorking] = useState<"push" | "pull" | null>(null);

  const push = async () => {
    setWorking("push");
    try {
      const nextCode = await onPush();
      setCode(nextCode);
    } catch {
      // Parent reports the actionable error through a toast.
    } finally {
      setWorking(null);
    }
  };

  const pull = async () => {
    if (!code.trim()) return;
    setWorking("pull");
    try {
      await onPull(code.trim());
      onClose();
    } catch {
      // Parent reports the actionable error through a toast.
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-dialog-title"
        className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="sync-dialog-title" className="text-lg font-semibold text-white">Encrypted cloud sync</h2>
            <p className="mt-1 text-sm text-zinc-400">{project.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300">Close ✕</button>
        </div>

        <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-200">
          Your board, script, and layout are encrypted in this browser before upload.
          Sketchcast stores only ciphertext. Video takes remain on this device.
        </div>

        <label htmlFor="sync-recovery-code" className="mt-5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Recovery code
        </label>
        <textarea
          id="sync-recovery-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="Push once to create a code, or paste a code from another device"
          className="mt-2 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-100 outline-none focus:border-indigo-500"
        />

        {code && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              toast.success("Recovery code copied. Keep it somewhere safe.");
            }}
            className="mt-2 text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Copy recovery code
          </button>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={push}
            disabled={working !== null}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {working === "push" ? "Encrypting + syncing…" : code ? "Push latest version" : "Create sync + push"}
          </button>
          <button
            type="button"
            onClick={pull}
            disabled={working !== null || !code.trim()}
            className="rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
          >
            {working === "pull" ? "Downloading + unlocking…" : "Pull from cloud"}
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
          There is no password reset: this code is the encryption key. Losing it means the
          cloud copy cannot be recovered. Local projects keep working without sync.
          {project.lastSyncedAt && ` Last synced ${new Date(project.lastSyncedAt).toLocaleString()}.`}
        </p>
      </div>
    </div>
  );
}
