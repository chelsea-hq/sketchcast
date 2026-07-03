"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = [
  {
    title: "Sketch it.",
    body: "Type the concept. AI drafts the whiteboard and a talk track, staged in the tray before you ever hit record.",
  },
  {
    title: "Say it.",
    body: "Record with your webcam while a teleprompter only you can see carries you. Drag diagram pieces on as you talk.",
  },
  {
    title: "Ship it.",
    body: "Cut flubs by clicking words in the transcript, drop in title slides, export for every platform with captions ready.",
  },
];

/** Pinned section: one line lights up per scroll third */
export default function PinnedTriplet() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = Math.min(0.999, Math.max(0, total > 0 ? -rect.top / total : 0));
      setActive(Math.floor(p * 3));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={wrapRef} className="relative bg-zinc-950" style={{ height: "220vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-10 px-6">
        {ITEMS.map((item, i) => (
          <div
            key={item.title}
            className="max-w-2xl text-center transition-all duration-500"
            style={{
              opacity: active === i ? 1 : 0.22,
              transform: active === i ? "scale(1)" : "scale(0.96)",
            }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              <span className="text-indigo-400">·</span> {item.title}
            </h2>
            <p
              className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-400 transition-opacity duration-500 md:text-base"
              style={{ opacity: active === i ? 1 : 0 }}
            >
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
