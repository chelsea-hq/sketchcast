import { redactForLog, serverKeysEnabled } from "@/lib/ai";
import { guardApiRequest } from "@/lib/api-guard";
import { creatorEntitlement, reserveUsage } from "@/lib/creator-cloud";
import { CREATOR_LIMITS } from "@/lib/creator-cloud-types";
import { readArrayBufferLimited, RequestBodyTooLargeError } from "@/lib/request-body";

export const maxDuration = 120;

const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&filler_words=true";

interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
}

export async function POST(request: Request) {
  const blocked = guardApiRequest(request, {
    maxBodyBytes: 30 * 1024 * 1024,
    allowedContentTypes: ["audio/wav", "audio/", "video/"],
  });
  if (blocked) return blocked;

  let audio: ArrayBuffer;
  try {
    audio = await readArrayBufferLimited(request, 30 * 1024 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    return Response.json({ error: "Could not read audio body" }, { status: 400 });
  }
  if (audio.byteLength === 0) {
    return Response.json({ error: "Empty audio body" }, { status: 400 });
  }

  const browserKey = request.headers.get("x-deepgram-key")?.trim();
  let key = browserKey;
  if (!key && serverKeysEnabled() && process.env.DEEPGRAM_API_KEY) {
    const entitlement = await creatorEntitlement();
    if (entitlement.plan === "creator" && entitlement.userId) {
      const view = new DataView(audio);
      const byteRate = audio.byteLength >= 32 ? view.getUint32(28, true) : 0;
      const dataBytes = audio.byteLength >= 44 ? view.getUint32(40, true) : 0;
      const seconds = byteRate > 0 ? Math.ceil(dataBytes / byteRate) : 0;
      if (seconds <= 0) {
        return Response.json({ error: "Invalid WAV audio" }, { status: 400 });
      }
      const reservation = await reserveUsage(
        entitlement.userId,
        "transcriptionSeconds",
        seconds,
        CREATOR_LIMITS.transcriptionSeconds
      );
      if (!reservation.allowed) {
        return Response.json(
          {
            error:
              reservation.reason === "global"
                ? "Creator Cloud reached its monthly transcription capacity. Add your own Deepgram key to continue."
                : "Monthly transcription limit reached. Add your own Deepgram key to continue.",
          },
          { status: 429 }
        );
      }
      key = process.env.DEEPGRAM_API_KEY;
    }
  }
  if (!key) {
    return Response.json(
      {
        error: "no_key",
        message: "Add a Deepgram key or use a Creator Cloud account for transcripts",
      },
      { status: 501 }
    );
  }

  try {
    const dg = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": request.headers.get("content-type") ?? "audio/wav",
      },
      body: audio,
    });
    if (!dg.ok) {
      console.error("Deepgram error:", dg.status, redactForLog(await dg.text()));
      return Response.json({ error: "Transcription failed" }, { status: 502 });
    }
    const data = (await dg.json()) as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{ words?: DeepgramWord[] }>;
        }>;
      };
    };
    const words = data.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
    return Response.json({
      words: words.map((w) => ({
        word: w.punctuated_word ?? w.word,
        start: w.start,
        end: w.end,
      })),
    });
  } catch (error) {
    console.error("Transcription request failed:", redactForLog(error));
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
