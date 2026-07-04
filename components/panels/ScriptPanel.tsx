"use client";

import type { PrompterSettings } from "@/components/Teleprompter";

interface ScriptPanelProps {
  script: string;
  onScriptChange: (script: string) => void;
  prompter: PrompterSettings;
  onPrompterChange: (patch: Partial<PrompterSettings>) => void;
}

export default function ScriptPanel({
  script,
  onScriptChange,
  prompter,
  onPrompterChange,
}: ScriptPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <textarea
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        placeholder={
          "Write or paste your script here…\n\nIt scrolls in the on-stage teleprompter that only you can see. It is never captured in the recording."
        }
        className="flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm leading-relaxed text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
      />
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onPrompterChange({ visible: !prompter.visible })}
          className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
            prompter.visible
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          {prompter.visible ? "Teleprompter is on" : "Show teleprompter"}
        </button>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={prompter.autoStart}
            onChange={(e) => onPrompterChange({ autoStart: e.target.checked })}
            className="accent-indigo-500"
          />
          Start scrolling automatically when recording starts
        </label>
      </div>
    </div>
  );
}
