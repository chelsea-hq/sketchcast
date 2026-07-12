"use client";

import type { PrompterSettings } from "./Teleprompter";
import AiPanel from "./panels/AiPanel";
import CopyPanel from "./panels/CopyPanel";
import ScriptPanel from "./panels/ScriptPanel";
import TakesPanel, { type Take } from "./panels/TakesPanel";
import TemplatesPanel from "./panels/TemplatesPanel";
import type { SketchTemplate } from "@/lib/templates";

type Tab = "ai" | "script" | "copy" | "templates" | "takes";

interface SidePanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onInsert: (mermaid: string) => Promise<boolean>;
  onSaveToTray: (mermaid: string, name: string) => Promise<boolean>;
  onUseScript: (script: string) => void;
  onOpenKeys: () => void;
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
  templateLimit: number | null;
  takes: Take[];
  onDeleteTake: (id: string) => void;
  onEditTake: (take: Take) => void;
}

function TabIcon({ tab }: { tab: Tab }) {
  const common = {
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };
  switch (tab) {
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
          <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" />
        </svg>
      );
    case "script":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <path d="M3 11l18-6-6 18-2.5-7.5L3 11z" />
        </svg>
      );
    case "templates":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "takes":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M7 5v4M12 5v4M17 5v4" />
        </svg>
      );
  }
}

const TAB_LABELS: Record<Tab, string> = {
  ai: "Diagram",
  script: "Script",
  copy: "Copy",
  templates: "Layouts",
  takes: "Takes",
};

export default function SidePanel(props: SidePanelProps) {
  const { tab, onTabChange } = props;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 grid shrink-0 grid-cols-5 gap-1 rounded-xl bg-zinc-900 p-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`relative flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors ${
              tab === key
                ? "bg-indigo-600 text-white"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <TabIcon tab={key} />
            <span className="text-[10px] font-semibold leading-none">
              {TAB_LABELS[key]}
            </span>
            {key === "takes" && props.takes.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {props.takes.length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "ai" && (
          <AiPanel
            onInsert={props.onInsert}
            onSaveToTray={props.onSaveToTray}
            onUseScript={props.onUseScript}
            onOpenKeys={props.onOpenKeys}
            onConceptUsed={props.onConceptUsed}
          />
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
            limit={props.templateLimit}
          />
        )}
        {tab === "takes" && (
          <TakesPanel
            takes={props.takes}
            onDelete={props.onDeleteTake}
            onEdit={props.onEditTake}
          />
        )}
      </div>
    </div>
  );
}

export type { Tab };
