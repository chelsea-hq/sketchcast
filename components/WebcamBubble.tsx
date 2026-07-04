"use client";

import { useEffect, type RefObject } from "react";

import { webcamRect, type WebcamLayout } from "@/lib/formats";

interface WebcamBubbleProps {
  stream: MediaStream | null;
  layout: WebcamLayout;
  stageW: number;
  stageH: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCycleCorner: () => void;
}

/**
 * Live camera preview positioned exactly where the recorder composites it,
 * so what you see on the stage is what lands in the exported video.
 * Click the bubble to move it to the next corner.
 */
export default function WebcamBubble({
  stream,
  layout,
  stageW,
  stageH,
  videoRef,
  onCycleCorner,
}: WebcamBubbleProps) {
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => undefined);
    }
  }, [stream, videoRef, layout.visible]);

  if (!stream) return null;

  const { x, y, d } = webcamRect(layout, stageW, stageH);

  return (
    <button
      type="button"
      onClick={onCycleCorner}
      title="Click to move the webcam to the next corner"
      className="pointer-events-auto absolute z-20 cursor-pointer overflow-hidden rounded-full shadow-xl ring-2 ring-white/90 transition-opacity hover:ring-indigo-400"
      style={{
        left: x,
        top: y,
        width: d,
        height: d,
        display: layout.visible ? "block" : "none",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </button>
  );
}
