"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getUserKeys, setUserKeys } from "@/lib/user-keys";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState(() => getUserKeys());

  const save = () => {
    setUserKeys(keys);
    toast.success("Keys saved in this browser");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Your API keys</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">
          Bring your own keys. They’re stored only in this browser and used
          only for your own generations; they never touch anyone else’s
          account or leave your machine except to call the AI providers.
        </p>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Anthropic key · diagrams, hooks + captions
          </label>
          <input
            type="password"
            value={keys.anthropic}
            onChange={(e) => setKeys((k) => ({ ...k, anthropic: e.target.value }))}
            placeholder="sk-ant-…"
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Get one at console.anthropic.com. Without it, diagrams and copy
            use built-in offline templates.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Deepgram key · transcript editing
          </label>
          <input
            type="password"
            value={keys.deepgram}
            onChange={(e) => setKeys((k) => ({ ...k, deepgram: e.target.value }))}
            placeholder="Deepgram API key"
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Get one at console.deepgram.com (free credit included). Unlocks
            click-a-word cutting and filler-word removal in the take editor.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Save keys
        </button>
      </div>
    </div>
  );
}
