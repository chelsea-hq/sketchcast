export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body too large");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readArrayBufferLimited(
  request: Request,
  maxBytes: number
): Promise<ArrayBuffer> {
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("body limit exceeded");
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output.buffer;
}

export async function readTextLimited(
  request: Request,
  maxBytes: number
): Promise<string> {
  return new TextDecoder().decode(await readArrayBufferLimited(request, maxBytes));
}

export async function readJsonLimited<T>(
  request: Request,
  maxBytes: number
): Promise<T> {
  return JSON.parse(await readTextLimited(request, maxBytes)) as T;
}
