import { generateStructured, readAiHeaders, redactForLog } from "@/lib/ai";
import { guardApiRequest } from "@/lib/api-guard";
import { fallbackCopy, type SocialCopy } from "@/lib/fallbacks";

export const maxDuration = 60;

const SYSTEM = `You write scroll-stopping packaging for educational creator videos recorded on a whiteboard.

Voice: confident, specific, zero clickbait that the video can't cash. Hooks are the first line a viewer reads or hears; make each one a different angle (curiosity, mistake, speed, contrarian, outcome). Titles must work as YouTube titles under 70 characters. Descriptions are ready to paste: YouTube gets 2-4 sentences plus a call to action, short-form gets 1-2 punchy lines, LinkedIn gets a 2-3 sentence professional-but-human version ending with a question. Hashtags: 5, lowercase, no spaces, relevant to the topic and to educational content.`;

const SCHEMA = {
  type: "object",
  properties: {
    hooks: { type: "array", items: { type: "string" } },
    titles: { type: "array", items: { type: "string" } },
    descriptions: {
      type: "object",
      properties: {
        youtube: { type: "string" },
        shortform: { type: "string" },
        linkedin: { type: "string" },
      },
      required: ["youtube", "shortform", "linkedin"],
      additionalProperties: false,
    },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["hooks", "titles", "descriptions", "hashtags"],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  const blocked = guardApiRequest(request);
  if (blocked) return blocked;

  let concept = "";
  let script = "";
  try {
    const body = (await request.json()) as { concept?: string; script?: string };
    concept = (body.concept ?? "").trim();
    script = (body.script ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!concept) {
    return Response.json({ error: "Concept is required" }, { status: 400 });
  }

  const userMessage = script
    ? `Video concept: ${concept.slice(0, 1000)}\n\nCreator's script/notes:\n${script.slice(0, 4000)}`
    : `Video concept: ${concept.slice(0, 1000)}`;

  const ai = readAiHeaders(request);
  try {
    const parsed = await generateStructured<SocialCopy>({
      ...ai,
      system: SYSTEM,
      user: userMessage,
      schema: SCHEMA,
      maxTokens: 2048,
    });
    return Response.json({ ...parsed, source: ai.provider });
  } catch (error) {
    console.error("Copy generation fell back to offline mode:", redactForLog(error));
    return Response.json({ ...fallbackCopy(concept), source: "offline" });
  }
}
