"use client";

import { useEffect, useRef, useState } from "react";

// Honest numbers only: product facts, not invented traction
const METRICS = [
  { value: 25, suffix: " min", label: "from concept to posted" },
  { value: 3, suffix: "", label: "export formats: 16:9, 9:16, 1:1" },
  { value: 0, suffix: "", label: "uploads. Everything stays in your browser" },
];

export default function Counters() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<number[]>(METRICS.map(() => 0));
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / 1200);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(METRICS.map((m) => Math.round(m.value * eased)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid gap-8 py-14 text-center md:grid-cols-3">
      {METRICS.map((m, i) => (
        <div key={m.label}>
          <p className="text-5xl font-bold tabular-nums tracking-tight text-zinc-900">
            {shown[i]}
            <span className="text-indigo-600">{m.suffix}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
