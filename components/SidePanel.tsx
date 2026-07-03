"use client";

import { useState } from "react";

import type { PrompterSettings } from "./Teleprompter";
import AiPanel from "./panels/AiPanel";
import CopyPanel from "./panels/CopyPanel";
import ScriptPanel from "./panels/ScriptPanel";
import TakesPanel, { type Take } from "./panels/TakesPanel";
import TemplatesPanel from "./panels/TemplatesPanel";
import type { SketchTemplate } from "@/lib/templates";

type Tab = "ai" | "script" | "copy" | "templates" | "takes";

interface SidePanelProps {
  onInsert: (mermaid: string) => Promise<boolean>;
  seedConcept: string;
  onConceptUsed: (concept: string) => void;
  script: string;
  onScriptChange: (script: string) => void;
  prompter: PrompterSettings;
  onPrompterChange: (patch: Partial<PrompterSettings>) => void;
  templates: SketchTemplate[];
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (template: SketchTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  takes: Take[];
  onDeleteTake: (id: string) => void;
}

const TAB_LABELS: Record<Tab, string> = {
  ai: "Diagram AI",
  script: "Script",
  copy: "Copy",
  templates: "Templates",
  takes: "Takes",
};

export default function SidePanel(props: SidePanelProps) {
  const [tab, setTab] = useState<Tab>("ai");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap gap-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            {TAB_LABELS[key]}
            {key === "takes" && props.takes.length > 0 && (
              <span className="ml-1 rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">
                {props.takes.length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "ai" && (
          <AiPanel onInsert={props.onInsert} onConceptUsed={props.onConceptUsed} />
        )}
        {tab === "script" && (
          <ScriptPanel
            script={props.script}
            onScriptChange={props.onScriptChange}
            prompter={props.prompter}
            onPrompterChange={props.onPrompterChange}
          />
        )}
        {tab === "copy" && (
          <CopyPanel seedConcept={props.seedConcept} script={props.script} />
        )}
        {tab === "templates" && (
          <TemplatesPanel
            templates={props.templates}
            onSave={props.onSaveTemplate}
            onLoad={props.onLoadTemplate}
            onDelete={props.onDeleteTemplate}
          />
        )}
        {tab === "takes" && (
          <TakesPanel takes={props.takes} onDelete={props.onDeleteTake} />
        )}
      </div>
    </div>
  );
}
