export type FormatKey = "16:9" | "9:16" | "1:1";

export interface FormatSpec {
  width: number;
  height: number;
  label: string;
  hint: string;
}

export const FORMATS: Record<FormatKey, FormatSpec> = {
  "16:9": {
    width: 1920,
    height: 1080,
    label: "16:9",
    hint: "YouTube, X, LinkedIn",
  },
  "9:16": {
    width: 1080,
    height: 1920,
    label: "9:16",
    hint: "Reels, TikTok, Shorts",
  },
  "1:1": {
    width: 1080,
    height: 1080,
    label: "1:1",
    hint: "Feed posts",
  },
};

export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];

export type WebcamCorner = "br" | "bl" | "tr" | "tl";

export interface WebcamLayout {
  corner: WebcamCorner;
  /** Bubble diameter as a fraction of the shorter output edge */
  sizeFrac: number;
  visible: boolean;
}

/** Default webcam layout per format. Vertical gets a bigger bubble since faces carry 9:16 content. */
export function defaultWebcamLayout(format: FormatKey): WebcamLayout {
  return {
    corner: "br",
    sizeFrac: format === "9:16" ? 0.32 : 0.24,
    visible: true,
  };
}

/** Margin between the bubble and the frame edge, as a fraction of the shorter edge. */
export const WEBCAM_MARGIN_FRAC = 0.035;

export function webcamRect(
  layout: WebcamLayout,
  stageW: number,
  stageH: number
): { x: number; y: number; d: number } {
  const short = Math.min(stageW, stageH);
  const d = layout.sizeFrac * short;
  const m = WEBCAM_MARGIN_FRAC * short;
  const x = layout.corner.includes("r") ? stageW - d - m : m;
  const y = layout.corner.includes("b") ? stageH - d - m : m;
  return { x, y, d };
}
