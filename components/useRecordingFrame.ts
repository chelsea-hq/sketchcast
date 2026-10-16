"use client";

import { useEffect, useState, type RefObject } from "react";
import { FORMATS, type FormatKey } from "@/lib/formats";

export function useRecordingFrame(
  stageRef: RefObject<HTMLDivElement | null>,
  format: FormatKey,
  active: boolean
) {
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 960, h: 540 });
  useEffect(() => {
    const el = stageRef.current;
    if (!active || !el) return;
    const spec = FORMATS[format];
    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const topUi = ch < 520 ? 56 : 84;
      const bottomUi = ch < 520 ? 44 : 56;
      const pad = 16;
      const scale = Math.min(
        (cw - pad * 2) / spec.width,
        (ch - topUi - bottomUi) / spec.height
      );
      const w = Math.max(180, Math.floor(spec.width * scale));
      const h = Math.max(180, Math.floor(spec.height * scale));
      setCrop({
        x: Math.floor((cw - w) / 2),
        y: Math.floor(topUi + (ch - topUi - bottomUi - h) / 2), w, h,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, format, stageRef]);
  return crop;
}
