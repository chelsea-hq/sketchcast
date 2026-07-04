import { generateStructured, readAiHeaders, redactForLog } from "@/lib/ai";
import { guardApiRequest } from "@/lib/api-guard";
import { fallbackDiagram } from "@/lib/fallbacks";

export const maxDuration = 60;

const SYSTEM = `You turn a creator's concept into a whiteboard diagram they can teach from on camera.

Rules for the diagram:
- Output Mermaid code only, in the JSON field requested. Prefer "flowchart TD" or "flowchart LR"; use "sequenceDiagram" only when the concept is genuinely an interaction between parties.
- 5 to 12 nodes. Node labels are 6 words or fewer, plain language, no jargon unless the concept is the jargon.
- Wrap every node label in double quotes inside the brackets, e.g. A["Like this"].
- No style/classDef/click directives. No HTML in labels.
- The diagram must read as a story: a viewer should follow it top-to-bottom or left-to-right while the creator talks.

Also produce a talk track: 3 to 5 short beats the creator can say while pointing at the diagram, ordered to match the diagram flow.`;

const SCHEMA = {
  type: "object",
  properties: {
    mermaid: {
      type: "string",
      description: "Valid Mermaid diagram code, nothing else",
    },
    talkTrack: {
      type: "array",
      items: { type: "string" },
      description: "3-5 spoken beats matching the diagram flow",
    },
  },
  required: ["mermaid", "talkTrack"],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  const blocked = guardApiRequest(request);
  if (blocked) return blocked;

  let concept = "";
  try {
    const body = (await request.json()) as { concept?: string };
    concept = (body.concept ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!concept) {
    return Response.json({ error: "Concept is required" }, { status: 400 });
  }
  if (concept.length > 2000) concept = concept.slice(0, 2000);

  const ai = readAiHeaders(request);
  try {
    const parsed = await generateStructured<{
      mermaid: string;
      talkTrack: string[];
    }>({
      ...ai,
      system: SYSTEM,
      user: `Concept to diagram for an educational video: ${concept}`,
      schema: SCHEMA,
      maxTokens: 2048,
    });
    return Response.json({ ...parsed, source: ai.provider });
  } catch (error) {
    console.error("Diagram generation fell back to offline mode:", redactForLog(error));
    return Response.json({ ...fallbackDiagram(concept), source: "offline" });
  }
}
