"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectSnapshot } from "@/lib/recovery-vault";

export default function ProjectPreview({ scene }: { scene: ProjectSnapshot["scene"] }) {
  const container = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    let started = false;
    const render = async () => {
      if (started || scene.elements.length === 0) return;
      started = true;
      try {
        const { exportToBlob, restoreElements } = await import("@excalidraw/excalidraw");
        if (cancelled) return;
        const blob = await exportToBlob({
          elements: restoreElements(scene.elements as Parameters<typeof restoreElements>[0], null),
          files: scene.files as Parameters<typeof exportToBlob>[0]["files"],
          appState: { viewBackgroundColor: scene.viewBackgroundColor, exportBackground: true, exportWithDarkMode: false },
          mimeType: "image/png", maxWidthOrHeight: 480,
        });
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSource(url);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void render();
      }
    }, { rootMargin: "120px" });
    if (container.current) observer.observe(container.current);
    return () => { cancelled = true; observer.disconnect(); if (url) URL.revokeObjectURL(url); };
  }, [scene]);
  return (
    <div ref={container} className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-white p-3 text-zinc-500">
      {source ? (
        // Blob previews are local, bounded raster images, not Next Image assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt="" className="max-h-full max-w-full object-contain" />
      ) : <span className="text-sm">{scene.elements.length === 0 ? "A fresh canvas" : unavailable ? "Preview unavailable" : "Preparing preview…"}</span>}
    </div>
  );
}
