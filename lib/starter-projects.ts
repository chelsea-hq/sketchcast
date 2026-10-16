import type { ProjectSnapshot } from "./recovery-vault";

export interface StarterProject {
  id: string;
  name: string;
  description: string;
  snapshot: ProjectSnapshot;
}

// Original teaching boards, authored for Sketchcast. These are ordinary editable
// Excalidraw 0.18 elements, not screenshots or remotely loaded template assets.
// Full base fields follow the installed element/types.d.ts. Keeping the data
// module independent of Excalidraw's browser runtime also makes SSR/tests safe.
function base(id: string, type: string, x: number, y: number, width: number, height: number) {
  return {
    id, type, x, y, width, height, angle: 0,
    strokeColor: "#263338", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1,
    opacity: 100, roundness: null, seed: 17 + id.length * 37,
    version: 1, versionNonce: 0, index: null, isDeleted: false,
    groupIds: [], frameId: null, boundElements: null, updated: 0,
    link: null, locked: false,
  };
}

function text(id: string, value: string, x: number, y: number, width: number, size = 24, color = "#263338") {
  return {
    ...base(id, "text", x, y, width, value.split("\n").length * size * 1.25),
    text: value, originalText: value, fontSize: size, fontFamily: 2,
    textAlign: "left", verticalAlign: "top", containerId: null,
    autoResize: false, lineHeight: 1.25, strokeColor: color,
  };
}

function box(id: string, x: number, y: number, width: number, height: number, color: string) {
  return {
    ...base(id, "rectangle", x, y, width, height),
    backgroundColor: color, roundness: { type: 3 },
  };
}

function arrow(id: string, x: number, y: number, points: [number, number][]) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    ...base(id, "arrow", x, y, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)),
    points, lastCommittedPoint: null, startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: "arrow", elbowed: false,
  };
}

function snapshot(elements: unknown[], script: string): ProjectSnapshot {
  return {
    format: "16:9", script,
    webcam: { visible: true, corner: "br", sizeFrac: 0.2 },
    scene: { elements, files: {}, viewBackgroundColor: "#fffdf7" },
  };
}

export const STARTER_PROJECTS: readonly StarterProject[] = [
  {
    id: "explain-a-process",
    name: "Explain a process",
    description: "Turn an idea into a first draft with a clear three-step story.",
    snapshot: snapshot([
      text("process-title", "From an idea to a first draft", 64, 48, 900, 42),
      text("process-intro", "A small process that makes starting easier", 66, 112, 850, 22, "#56696c"),
      box("process-one", 64, 200, 280, 218, "#d3f1df"),
      box("process-two", 402, 200, 280, 218, "#ffecb3"),
      box("process-three", 740, 200, 280, 218, "#dbe9ff"),
      text("process-one-number", "01", 88, 222, 230, 20, "#3e7462"),
      text("process-one-heading", "Choose a question", 88, 265, 240, 26),
      text("process-one-body", "What should someone\nunderstand by the end?", 88, 318, 235, 20),
      text("process-two-number", "02", 426, 222, 230, 20, "#7a6325"),
      text("process-two-heading", "Sketch one answer", 426, 265, 240, 26),
      text("process-two-body", "Use a few shapes.\nMake the idea visible.", 426, 318, 235, 20),
      text("process-three-number", "03", 764, 222, 230, 20, "#456aa2"),
      text("process-three-heading", "Try it with someone", 764, 265, 240, 25),
      text("process-three-body", "Notice what is unclear.\nImprove that part first.", 764, 318, 235, 20),
      arrow("process-next-one", 356, 307, [[0, 0], [34, 0]]),
      arrow("process-next-two", 694, 307, [[0, 0], [34, 0]]),
      text("process-takeaway", "Start small. Make it visible. Learn from the response.", 66, 476, 820, 25),
    ], "A first draft starts with one useful question. What should someone understand by the end?\n\nFirst, choose that question. Keep it small enough to answer in a minute.\n\nNext, sketch one answer. A few boxes and arrows can make the relationship clearer than a paragraph. The drawing only needs to help someone follow your thinking.\n\nFinally, try the explanation with another person. Ask which part was unclear, then improve that part first.\n\nThe process is simple: start small, make it visible, and learn from the response. Pick one idea and make its first draft today."),
  },
  {
    id: "compare-two-ideas",
    name: "Compare two ideas",
    description: "Show how practice and performance serve different purposes.",
    snapshot: snapshot([
      text("compare-title", "Practice and performance", 64, 48, 900, 42),
      text("compare-intro", "Two useful modes. Two different goals.", 66, 112, 850, 22, "#56696c"),
      box("compare-practice", 64, 192, 446, 260, "#d3f1df"),
      box("compare-performance", 548, 192, 446, 260, "#e9e0ff"),
      text("compare-practice-title", "PRACTICE", 92, 218, 380, 28, "#315b4e"),
      text("compare-practice-goal", "Goal: improve one skill", 92, 274, 380, 26),
      text("compare-practice-body", "Slow down and isolate a step\nRepeat with useful feedback\nUse mistakes as information", 92, 328, 380, 22),
      text("compare-performance-title", "PERFORMANCE", 576, 218, 380, 28, "#65448d"),
      text("compare-performance-goal", "Goal: deliver an outcome", 576, 274, 380, 26),
      text("compare-performance-body", "Bring the steps together\nKeep moving with the audience\nUse the skills you have built", 576, 328, 380, 22),
      arrow("compare-feedback", 768, 477, [[0, 0], [0, 39], [-500, 39], [-500, 0]]),
      text("compare-takeaway", "What you notice in a performance can guide your next practice.", 66, 550, 945, 24),
    ], "Practice and performance can look similar, but they serve different purposes.\n\nIn practice, the goal is to improve one skill. You can slow down, isolate a difficult step, and repeat it with feedback. Mistakes help you choose what to work on.\n\nIn performance, the goal is to deliver an outcome. You bring the steps together and keep moving with your audience. For example, rehearsing one transition in a lesson is practice. Teaching the full lesson is a performance.\n\nBoth modes matter. After a performance, notice one part that could be clearer. Make that the focus of your next practice.\n\nBefore you begin, ask yourself: am I here to improve a skill, or to deliver an outcome?"),
  },
  {
    id: "teach-a-concept",
    name: "Teach a concept",
    description: "Explain a feedback loop using a thermostat and a simple diagram.",
    snapshot: snapshot([
      text("concept-title", "How a feedback loop works", 64, 48, 940, 42),
      text("concept-intro", "Example: keeping a room near a target temperature", 66, 112, 900, 22, "#56696c"),
      box("concept-observe", 64, 218, 280, 180, "#dbe9ff"),
      box("concept-compare", 402, 218, 280, 180, "#ffecb3"),
      box("concept-adjust", 740, 218, 280, 180, "#d3f1df"),
      text("concept-observe-title", "1. Observe", 88, 244, 230, 30),
      text("concept-observe-body", "Measure the room's\ncurrent temperature.", 88, 310, 235, 22),
      text("concept-compare-title", "2. Compare", 426, 244, 230, 30),
      text("concept-compare-body", "Is it below the\ntarget temperature?", 426, 310, 235, 22),
      text("concept-adjust-title", "3. Adjust", 764, 244, 230, 30),
      text("concept-adjust-body", "Switch the heating\non or off as needed.", 764, 310, 235, 22),
      arrow("concept-next-one", 356, 306, [[0, 0], [34, 0]]),
      arrow("concept-next-two", 694, 306, [[0, 0], [34, 0]]),
      arrow("concept-loop", 880, 414, [[0, 0], [0, 66], [-680, 66], [-680, 0]]),
      text("concept-loop-label", "Measure again", 440, 496, 250, 22, "#3e7462"),
      text("concept-takeaway", "The result of one action helps decide the next action.", 66, 560, 850, 25),
    ], "A feedback loop uses the result of one action to help decide the next action. A thermostat gives us a simple example.\n\nFirst, it observes the room's temperature.\n\nSecond, it compares that measurement with a target. If the room is colder than the target, heating is needed.\n\nThird, it adjusts by switching the heating on. When the room is warm enough, it switches the heating off.\n\nThe important part is the return arrow. The thermostat measures again, so the next decision uses the new result. That makes this a loop, rather than a one-time instruction.\n\nYou can look for the same pattern in your own work: observe what happened, compare it with your goal, adjust one thing, and observe again."),
  },
];
