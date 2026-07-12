/**
 * Offline generators used by the API routes when Claude credentials are
 * missing or the API call fails. The app should never dead-end: creators
 * always get a usable diagram and usable copy, just less tailored.
 */

function sanitizeLabel(text: string): string {
  return text.replace(/["\[\]{}()|]/g, "").trim().slice(0, 42);
}

function splitOnSeparators(concept: string): string[] {
  const parts: string[] = [];
  let current = "";

  const flush = () => {
    if (current) parts.push(current);
    current = "";
  };

  for (let index = 0; index < concept.length; index += 1) {
    const character = concept[index];
    const isAsciiArrow = character === "-" && concept[index + 1] === ">";
    if (
      character === "." ||
      character === ";" ||
      character === "!" ||
      character === "?" ||
      character === "," ||
      character === "\n" ||
      character === "→" ||
      isAsciiArrow
    ) {
      flush();
      if (isAsciiArrow) index += 1;
    } else {
      current += character;
    }
  }
  flush();
  return parts;
}

function splitIntoSteps(concept: string): string[] {
  const parts = splitOnSeparators(concept)
    .map((p) => sanitizeLabel(p))
    .filter((p) => p.length > 2);
  if (parts.length >= 2) return parts.slice(0, 8);
  const words = concept.trim().split(/\s+/);
  if (words.length <= 4) return [concept.trim()];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].map(sanitizeLabel);
}

export function fallbackDiagram(concept: string): {
  mermaid: string;
  talkTrack: string[];
  script: string;
} {
  const steps = splitIntoSteps(concept);
  const ids = "ABCDEFGH".split("");
  const lines = ["flowchart TD"];
  if (steps.length === 1) {
    lines.push(`  A["${steps[0]}"]`);
    lines.push(`  A --> B["Why it matters"]`);
    lines.push(`  A --> C["How it works"]`);
    lines.push(`  A --> D["Example"]`);
  } else {
    steps.forEach((step, i) => {
      lines.push(`  ${ids[i]}["${step}"]`);
    });
    for (let i = 0; i < steps.length - 1; i++) {
      lines.push(`  ${ids[i]} --> ${ids[i + 1]}`);
    }
  }
  const spokenSteps =
    steps.length > 1
      ? steps
          .map((step, i) =>
            i === 0
              ? `It starts with ${step.toLowerCase()}.`
              : i === steps.length - 1
                ? `And that's how you get to ${step.toLowerCase()}.`
                : `From there, ${step.toLowerCase()}.`
          )
          .join(" ")
      : `Here's the core idea: ${concept.trim()}. Let me show you why it matters, how it works, and a quick example.`;

  return {
    mermaid: lines.join("\n"),
    talkTrack: [
      "Open with the problem your viewer has",
      "Walk the boxes left to right as you talk",
      "Pause on the step people usually get wrong",
      "Close with the one thing to remember",
    ],
    script: `If you've ever wondered about ${concept.trim().toLowerCase()}, this board is for you. ${spokenSteps} If this helped, save it and share it with someone who needs it.`,
  };
}

export interface SocialCopy {
  hooks: string[];
  titles: string[];
  descriptions: {
    youtube: string;
    shortform: string;
    linkedin: string;
  };
  hashtags: string[];
}

export function fallbackCopy(concept: string): SocialCopy {
  const topic = concept.trim().replace(/\s+/g, " ").slice(0, 80) || "this concept";
  return {
    hooks: [
      `Most people get ${topic} completely wrong. Here's the 60-second version.`,
      `I drew ${topic} on a whiteboard so you never have to Google it again.`,
      `If you can't explain ${topic} in one diagram, watch this.`,
      `${topic}, explained the way I wish someone had explained it to me.`,
      `Stop memorizing ${topic}. Understand it in one sketch instead.`,
    ],
    titles: [
      `${topic} explained on a whiteboard`,
      `${topic} in 60 seconds`,
      `The simplest explanation of ${topic} you'll ever see`,
      `${topic}: the diagram that makes it click`,
      `How ${topic} actually works`,
    ],
    descriptions: {
      youtube: `In this video I break down ${topic} on a whiteboard, step by step. By the end you'll be able to explain it to someone else, which is the real test of understanding. Drop a comment with the concept you want diagrammed next.`,
      shortform: `${topic}, one whiteboard, zero fluff. Save this for later and share it with someone who needs it.`,
      linkedin: `I've explained ${topic} dozens of times, so I finally drew it out. One whiteboard, the whole idea. What concept should I diagram next?`,
    },
    hashtags: ["#learnontiktok", "#educational", "#whiteboard", "#explained", "#creator"],
  };
}
