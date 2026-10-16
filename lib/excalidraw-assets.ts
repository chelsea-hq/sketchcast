// Load from the Studio route before its dynamic import, not from the Board:
// Excalidraw initializes its font registry while the Studio bundle evaluates.
// npm run dev/build copies the installed package's fonts to this public path.
if (typeof window !== "undefined") {
  (window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = "/excalidraw/";
}

export {};
