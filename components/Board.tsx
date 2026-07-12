"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";

interface BoardProps {
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
  onSceneChange?: ExcalidrawProps["onChange"];
}

export default function Board({ onApiReady, onSceneChange }: BoardProps) {
  return (
    <div className="h-full w-full" data-sketchcast-board>
      <Excalidraw
        excalidrawAPI={onApiReady}
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
