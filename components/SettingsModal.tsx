"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/providers";
import { getUserKeys, setUserKeys } from "@/lib/user-keys";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState(() => getUserKeys());
  const active = PROVIDERS[keys.provider];

  const save = () => {
    setUserKeys(keys);
    toast.success("Keys saved in this browser");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-full w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5">
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
          Bring your own keys. They’re stored only in this browser and travel
          only inside your own requests to the AI providers; the server never
          stores or logs them. Tip: create a separate key just for Sketchcast
          and set a spend cap in your provider’s console.
        </p>

        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            AI provider · diagrams, hooks + captions
          </label>
          <select
            value={keys.provider}
            onChange={(e) =>
              setKeys((k) => ({ ...k, provider: e.target.value as ProviderId, model: "" }))
            }
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDERS[id].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {active.label} key
          </label>
          <input
            type="password"
            value={keys.keys[keys.provider]}
            onChange={(e) =>
              setKeys((k) => ({
                ...k,
                keys: { ...k.keys, [k.provider]: e.target.value },
              }))
            }
            placeholder={active.keyHint}
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Get one at {active.consoleUrl}. Without a key, diagrams and copy
            use built-in offline templates.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Model (optional)
          </label>
          <input
            value={keys.model}
            onChange={(e) => setKeys((k) => ({ ...k, model: e.target.value }))}
            placeholder={active.defaultModel}
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Leave blank for the default. On OpenRouter you can point this at
            almost any model, e.g. meta-llama or mistral.
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
