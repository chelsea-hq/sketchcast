"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface BoardProps {
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
}

export default function Board({ onApiReady }: BoardProps) {
  return (
    <div className="h-full w-full" data-sketchcast-board>
      <Excalidraw
        excalidrawAPI={onApiReady}
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
