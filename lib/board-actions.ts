import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import type { SketchTemplate } from "./templates";

/**
 * Converts Mermaid code into Excalidraw elements and appends them to the
 * current scene, then scrolls the new diagram into view.
 */
export async function insertMermaidIntoScene(
  api: ExcalidrawImperativeAPI,
  mermaid: string
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
  api.scrollToContent(converted, { fitToViewport: true, animate: true });
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
