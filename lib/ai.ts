import Anthropic from "@anthropic-ai/sdk";

import { PROVIDERS, isProviderId, type ProviderId } from "./providers";

export interface AiRequestConfig {
  provider: ProviderId;
  apiKey?: string;
  model?: string;
}

/** Resolve which provider/key/model to use from the request headers */
export function readAiHeaders(request: Request): AiRequestConfig {
  const legacyKey = request.headers.get("x-anthropic-key")?.trim();
  const rawProvider = request.headers.get("x-ai-provider")?.trim() ?? "";
  const provider: ProviderId = isProviderId(rawProvider)
    ? rawProvider
    : "anthropic";
  return {
    provider,
    apiKey: request.headers.get("x-ai-key")?.trim() || legacyKey || undefined,
    model: request.headers.get("x-ai-model")?.trim() || undefined,
  };
}

interface StructuredArgs extends AiRequestConfig {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

/**
 * One structured-JSON generation across providers. Anthropic uses the native
 * SDK with schema-enforced output; OpenAI, OpenRouter, and Gemini share the
 * OpenAI-compatible chat completions shape with JSON mode.
 */
export async function generateStructured<T>(args: StructuredArgs): Promise<T> {
  if (args.provider === "anthropic") {
    const client = new Anthropic(args.apiKey ? { apiKey: args.apiKey } : {});
    const response = await client.messages.create({
      model:
        args.model || process.env.SKETCHCAST_MODEL || PROVIDERS.anthropic.defaultModel,
      max_tokens: args.maxTokens,
      system: args.system,
      output_config: {
        format: { type: "json_schema", schema: args.schema },
      },
      messages: [{ role: "user", content: args.user }],
    });
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("Empty model response");
    return JSON.parse(text) as T;
  }

  const config = PROVIDERS[args.provider];
  const key = args.apiKey || process.env[config.envKey];
  if (!key) throw new Error(`No API key configured for ${config.label}`);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: args.model || config.defaultModel,
      max_tokens: args.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${args.system}\n\nRespond with ONLY a JSON object that matches this JSON Schema. No markdown fences, no commentary.\n${JSON.stringify(args.schema)}`,
        },
        { role: "user", content: args.user },
      ],
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`${config.label} error ${response.status}: ${detail}`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty model response");
  return JSON.parse(stripFences(raw)) as T;
}
