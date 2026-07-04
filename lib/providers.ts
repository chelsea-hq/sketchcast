export type ProviderId = "anthropic" | "openai" | "openrouter" | "gemini";

export interface ProviderConfig {
  label: string;
  /** OpenAI-compatible base URL; unused for the native Anthropic path */
  baseUrl: string;
  defaultModel: string;
  envKey: string;
  keyHint: string;
  consoleUrl: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    label: "Anthropic Claude",
    baseUrl: "",
    defaultModel: "claude-opus-4-8",
    envKey: "ANTHROPIC_API_KEY",
    keyHint: "sk-ant-…",
    consoleUrl: "console.anthropic.com",
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
    keyHint: "sk-…",
    consoleUrl: "platform.openai.com",
  },
  openrouter: {
    label: "OpenRouter · any model",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    envKey: "OPENROUTER_API_KEY",
    keyHint: "sk-or-…",
    consoleUrl: "openrouter.ai",
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    envKey: "GEMINI_API_KEY",
    keyHint: "AIza…",
    consoleUrl: "aistudio.google.com",
  },
};

export const PROVIDER_IDS: ProviderId[] = [
  "anthropic",
  "openai",
  "openrouter",
  "gemini",
];

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as string[]).includes(value);
}
