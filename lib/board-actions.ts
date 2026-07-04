import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import type { SketchTemplate } from "./templates";

export interface ViewFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Converts Mermaid code into Excalidraw elements and appends them to the
 * current scene. When a frame is given (the visible part of the recorded
 * area), the view pans and zooms so the new diagram lands inside it
 * instead of sprawling into the backstage wings.
 */
export async function insertMermaidIntoScene(
  api: ExcalidrawImperativeAPI,
  mermaid: string,
  frame?: ViewFrame | null
): Promise<void> {
  // Heavy dependency; only load it when a diagram is actually inserted
  const { parseMermaidToExcalidraw } = await import(
    "@excalidraw/mermaid-to-excalidraw"
  );
  const { elements, files } = await parseMermaidToExcalidraw(mermaid);
  const converted = convertToExcalidrawElements(
    elements as Parameters<typeof convertToExcalidrawElements>[0],
    { regenerateIds: true }
  );
  api.updateScene({
    elements: [...api.getSceneElements(), ...converted],
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
  if (files) {
    api.addFiles(Object.values(files));
  }

  let framed = false;
  if (frame && frame.w > 40 && frame.h > 40 && converted.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const el of converted) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
    const bw = maxX - minX;
    const bh = maxY - minY;
    if (bw > 0 && bh > 0) {
      const zoom = Math.min((frame.w * 0.84) / bw, (frame.h * 0.8) / bh, 1.2);
      const cx = frame.x + frame.w / 2;
      const cy = frame.y + frame.h / 2;
      api.updateScene({
        appState: {
          // Branded zoom type; the arithmetic above keeps it in sane bounds
          zoom: { value: zoom as unknown as never },
          scrollX: cx / zoom - (minX + bw / 2),
          scrollY: cy / zoom - (minY + bh / 2),
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      framed = true;
    }
  }
  if (!framed) {
    api.scrollToContent(converted, { fitToViewport: true, animate: true });
  }
}

/**
 * Parses Mermaid into Excalidraw elements and stores them as a Library item
 * instead of placing them on the board. The Library panel acts as the
 * staging tray: the creator drags items onto the canvas mid-recording, and
 * since the panel is DOM (not canvas) it never appears in the export.
 */
export async function addMermaidToTray(
  api: ExcalidrawImperativeAPI,
  mermaid: string,
  name: string
): Promise<void> {
  const { parseMermaidToExcalidraw } = await import(
    "@excalidraw/mermaid-to-excalidraw"
  );
  const { elements, files } = await parseMermaidToExcalidraw(mermaid);
  const converted = convertToExcalidrawElements(
    elements as Parameters<typeof convertToExcalidrawElements>[0],
    { regenerateIds: true }
  );
  if (files) {
    api.addFiles(Object.values(files));
  }
  await api.updateLibrary({
    libraryItems: [
      {
        id: `tray_${Date.now()}`,
        status: "unpublished",
        created: Date.now(),
        name: name.slice(0, 60),
        elements: converted,
      },
    ],
    merge: true,
    openLibraryMenu: true,
  });
}

export function captureTemplateScene(
  api: ExcalidrawImperativeAPI
): SketchTemplate["scene"] {
  return {
    elements: api.getSceneElements().map((el) => ({ ...el })),
    files: api.getFiles() as unknown as Record<string, unknown>,
    viewBackgroundColor: api.getAppState().viewBackgroundColor,
  };
}

export function applyTemplateScene(
  api: ExcalidrawImperativeAPI,
  scene: SketchTemplate["scene"]
): void {
  // Stored scenes are plain JSON whose shape is owned by Excalidraw
  if (scene.files && Object.keys(scene.files).length > 0) {
    api.addFiles(Object.values(scene.files) as never[]);
  }
  api.updateScene({
    elements: scene.elements as never[],
    appState: { viewBackgroundColor: scene.viewBackgroundColor },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
  api.scrollToContent();
}
