"use client";

import { useCallback, useEffect, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";

import { createCanvasApiReadyGate } from "@/lib/canvas-api-ready";

interface BoardProps {
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
  onSceneChange?: ExcalidrawProps["onChange"];
}

export default function Board({ onApiReady, onSceneChange }: BoardProps) {
  const onApiReadyRef = useRef(onApiReady);
  const latestApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const gateRef = useRef<ReturnType<
    typeof createCanvasApiReadyGate<ExcalidrawImperativeAPI>
  > | null>(null);

  useEffect(() => {
    onApiReadyRef.current = onApiReady;
  }, [onApiReady]);

  useEffect(() => {
    const gate = createCanvasApiReadyGate<ExcalidrawImperativeAPI>(
      (api) => onApiReadyRef.current(api),
      {
        schedule: (callback) => window.requestAnimationFrame(callback),
        cancel: (frameId) => window.cancelAnimationFrame(frameId),
      }
    );
    gateRef.current = gate;
    if (latestApiRef.current) gate.publish(latestApiRef.current);

    return () => {
      gate.dispose();
      gateRef.current = null;
    };
  }, []);

  const handleExcalidrawApi = useCallback((api: ExcalidrawImperativeAPI) => {
    latestApiRef.current = api;
    gateRef.current?.publish(api);
  }, []);

  return (
    <div className="h-full w-full" data-sketchcast-board>
      <Excalidraw
        excalidrawAPI={handleExcalidrawApi}
        onChange={onSceneChange}
        initialData={{
          appState: { viewBackgroundColor: "#ffffff" },
        }}
        UIOptions={{
          canvasActions: {
            toggleTheme: false,
            clearCanvas: true,
            loadScene: true,
            saveToActiveFile: false,
          },
        }}
      />
    </div>
  );
}
