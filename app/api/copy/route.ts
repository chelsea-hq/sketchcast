import {
  generateStructured,
  managedAiConfig,
  readAiHeaders,
  redactForLog,
} from "@/lib/ai";
import { guardApiRequest } from "@/lib/api-guard";
import { CREATOR_LIMITS } from "@/lib/creator-cloud-types";
import { creatorEntitlement, reserveUsage } from "@/lib/creator-cloud";
import { fallbackCopy, type SocialCopy } from "@/lib/fallbacks";
import { readJsonLimited, RequestBodyTooLargeError } from "@/lib/request-body";

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
    const body = await readJsonLimited<{ concept?: string; script?: string }>(
      request,
      64 * 1024
    );
    concept = (body.concept ?? "").trim();
    script = (body.script ?? "").trim();
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!concept) {
    return Response.json({ error: "Concept is required" }, { status: 400 });
  }

  const userMessage = script
    ? `Video concept: ${concept.slice(0, 1000)}\n\nCreator's script/notes:\n${script.slice(0, 4000)}`
    : `Video concept: ${concept.slice(0, 1000)}`;

  let ai = readAiHeaders(request);
  let source = ai.provider as string;
  if (!ai.apiKey) {
    const entitlement = await creatorEntitlement();
    const managed = managedAiConfig(ai);
    if (entitlement.plan === "creator" && entitlement.userId && managed) {
      const reservation = await reserveUsage(
        entitlement.userId,
        "aiGenerations",
        1,
        CREATOR_LIMITS.aiGenerations
      );
      if (!reservation.allowed) {
        return Response.json(
          {
            error:
              reservation.reason === "global"
                ? "Creator Cloud reached its monthly managed AI capacity. Add your own key to keep creating."
                : "Monthly managed AI limit reached. Add your own key to keep creating.",
          },
          { status: 429 }
        );
      }
      ai = managed;
      source = "creator-cloud";
    }
  }
  if (!ai.apiKey) {
    return Response.json({ ...fallbackCopy(concept), source: "offline" });
  }
  try {
    const parsed = await generateStructured<SocialCopy>({
      ...ai,
      system: SYSTEM,
      user: userMessage,
      schema: SCHEMA,
      maxTokens: 2048,
    });
    return Response.json({ ...parsed, source });
  } catch (error) {
    console.error("Copy generation fell back to offline mode:", redactForLog(error));
    return Response.json({ ...fallbackCopy(concept), source: "offline" });
  }
}
