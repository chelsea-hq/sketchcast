"use client";

import { useEffect, useRef } from "react";

export interface PrompterSettings {
  visible: boolean;
  playing: boolean;
  /** Scroll speed in pixels per second */
  speed: number;
  fontSize: number;
  opacity: number;
  autoStart: boolean;
}

interface TeleprompterProps {
  script: string;
  settings: PrompterSettings;
  onChange: (patch: Partial<PrompterSettings>) => void;
}

/**
 * Scrolling script overlay rendered on top of the stage. It is deliberately
 * outside the recording pipeline: the creator sees it, the video never does.
 */
export default function Teleprompter({
  script,
  settings,
  onChange,
}: TeleprompterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settings.playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop += ((now - last) / 1000) * settings.speed;
      last = now;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        onChange({ playing: false });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [settings.playing, settings.speed, onChange]);

  if (!settings.visible) return null;

  return (
    <div
      className="absolute inset-x-0 top-0 z-30 flex flex-col rounded-b-2xl text-white backdrop-blur-sm"
      style={{
        height: "38%",
        backgroundColor: `rgba(9, 9, 11, ${settings.opacity})`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-1.5 text-[11px]">
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-medium text-emerald-300">
          Prompter · not recorded
        </span>
        <button
          type="button"
          onClick={() => onChange({ playing: !settings.playing })}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          {settings.playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            onChange({ playing: false });
          }}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          Restart
        </button>
        <label className="flex items-center gap-1 text-white/70">
          Speed
          <input
            type="range"
            min={10}
            max={160}
            value={settings.speed}
            onChange={(e) => onChange({ speed: Number(e.target.value) })}
            className="w-16 accent-indigo-400"
          />
        </label>
        <label className="flex items-center gap-1 text-white/70">
          Size
          <input
            type="range"
            min={14}
            max={40}
            value={settings.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="w-14 accent-indigo-400"
          />
        </label>
        <label className="flex items-center gap-1 text-white/70">
          Dim
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={settings.opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="w-14 accent-indigo-400"
          />
        </label>
        <button
          type="button"
          onClick={() => onChange({ visible: false, playing: false })}
          className="ml-auto rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          Hide
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-3 leading-relaxed"
        style={{ fontSize: settings.fontSize }}
      >
        {script.trim() ? (
          <p className="whitespace-pre-wrap pb-[60%]">{script}</p>
        ) : (
          <p className="text-white/50">
            Write your script in the Script tab and it will scroll here while
            you record…
          </p>
        )}
      </div>
    </div>
  );
}
