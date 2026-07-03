import { guardApiRequest } from "@/lib/api-guard";

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

  // Bring-your-own-key: a browser-supplied key wins over the server env
  const key =
    request.headers.get("x-deepgram-key")?.trim() ||
    process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return Response.json(
      {
        error: "no_key",
        message: "Set DEEPGRAM_API_KEY in .env.local to enable transcripts",
      },
      { status: 501 }
    );
  }

  const audio = await request.arrayBuffer();
  if (audio.byteLength === 0) {
    return Response.json({ error: "Empty audio body" }, { status: 400 });
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
      console.error("Deepgram error:", dg.status, await dg.text());
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
    console.error("Transcription request failed:", error);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
